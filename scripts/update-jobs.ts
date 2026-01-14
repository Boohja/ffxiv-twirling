/**
 * XIVAPI v2 updater (test mode: first 2 pages only)
 * - Fetch Actions via v2 search (player actions only)
 * - For each action, inspect ClassJobCategory.fields to see which jobs can use it
 * - If a job JSON file exists under src/lib/assets/xiv/jobs/<job>.json, add the action
 *   to that file (appending { row_id, name, icon }) if not already present by row_id
 * - Download the icon once to src/lib/assets/xiv/actions/<row_id>.png using the v2 asset endpoint
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { Jobs } from '../src/lib/jobs.ts';

const ROOT = process.cwd();
const JOBS_DIR = path.join(ROOT, 'src', 'lib', 'assets', 'xiv', 'jobs');
const ACTIONS_DIR = path.join(ROOT, 'src', 'lib', 'assets', 'xiv', 'actions');
const V2 = 'https://v2.xivapi.com';

type V2SearchResponse = {
	next?: string | null;
	results: Array<{
		sheet: 'Action';
		row_id: number;
		fields: {
			Name?: string;
			Icon?: { id?: number; path?: string; path_hr1?: string };
			ClassJobCategory?: {
				value: number;
				sheet: string;
				row_id: number;
				fields?: Record<string, unknown>;
			};
		};
	}>;
};

type JobEntry = { row_id: number; name: string; icon: string };

async function ensureDir(dir: string) {
	await fs.mkdir(dir, { recursive: true });
}

async function fileExists(p: string): Promise<boolean> {
	try {
		await fs.access(p);
		return true;
	} catch {
		return false;
	}
}

async function getJSON<T>(url: string): Promise<T> {
	const res = await fetch(url, { headers: { 'user-agent': 'ffxiv-twirling/0.0.1 (+github.com/Boohja/ffxiv-twirling)' } });
	if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
	return (await res.json()) as T;
}

async function getBinary(url: string): Promise<Uint8Array> {
	const res = await fetch(url, { headers: { 'user-agent': 'ffxiv-twirling/0.0.1 (+github.com/Boohja/ffxiv-twirling)' } });
	if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
	const ab = await res.arrayBuffer();
	return new Uint8Array(ab);
}
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readJobJson(filePath: string): Promise<JobEntry[]> {
	try {
		const txt = await fs.readFile(filePath, 'utf8');
		const data = txt.trim() ? (JSON.parse(txt) as JobEntry[]) : [];
		return Array.isArray(data) ? data : [];
	} catch (e) {
		const err = e as NodeJS.ErrnoException;
		if (err && err.code === 'ENOENT') return [];
		console.warn(`Failed to read ${filePath}: ${err?.message}`);
		throw e;
	}
}

async function writeJobJson(filePath: string, entries: JobEntry[]): Promise<void> {
	const txt = JSON.stringify(entries, null, 2) + '\n';
	await fs.writeFile(filePath, txt, 'utf8');
}

function hasRowId(entries: JobEntry[], id: number): boolean {
	return entries.some((e) => e.row_id === id);
}

// Build a map of job ABBR (uppercase) -> json file path using exported Jobs list
function jobsListToFileMap(): Map<string, string> {
	const map = new Map<string, string>();
	for (const j of Jobs) {
		const abbr = j.id.toUpperCase();
		const filePath = path.join(JOBS_DIR, `${j.id}.json`);
		map.set(abbr, filePath);
	}
	return map;
}

function extractEligibleJobs(fields?: Record<string, unknown>): string[] {
	if (!fields) return [];
	const jobs: string[] = [];
	for (const [key, val] of Object.entries(fields)) {
		if (key === 'Name') continue;
		if (typeof val === 'boolean' && val && /^[A-Z]{3}$/.test(key)) {
			jobs.push(key);
		}
	}
	return jobs;
}

function iconPathForRow(rowId: number): string {
	return `actions/${rowId}.png`;
}

async function fetchAndStoreIconOnce(rowId: number, iconPath: string | undefined, iconPathHr1: string | undefined) {
	const outPath = path.join(ACTIONS_DIR, `${rowId}.png`);
	try {
		await fs.access(outPath);
		return; // already exists
	} catch {
		// proceed
	}
  console.log(`  Fetching icon for action ${rowId}`);
	const src = iconPathHr1 || iconPath;
	if (!src) return;
	const url = `${V2}/api/asset?path=${encodeURIComponent(src)}&format=png`;
	const bin = await getBinary(url);
	await fs.writeFile(outPath, bin);
	await sleep(1500);
}

export async function updateJobFiles(): Promise<void> {
	await ensureDir(ACTIONS_DIR);
  await ensureDir(JOBS_DIR);
  const jobMap = jobsListToFileMap(); // e.g., WHM -> <path>/whm.json

	// Load all job files once into memory
	const jobCache = new Map<string, JobEntry[]>(); // ABBR -> entries
	for (const [abbr, filePath] of jobMap.entries()) {
    // Ensure file exists; create empty if missing
    if (!(await fileExists(filePath))) {
      await writeJobJson(filePath, []);
    }
		const entries = await readJobJson(filePath);
		jobCache.set(abbr, entries);
	}

	// CLI flags: --test limits to 2 pages; --pages=N overrides
	const argv = process.argv.slice(2);
	const isTest = argv.includes('--test');
	let maxPages = isTest ? 2 : Number.POSITIVE_INFINITY;
	const pagesArg = argv.find((a) => a.startsWith('--pages='));
	if (pagesArg) {
		const n = Number(pagesArg.split('=')[1]);
		if (Number.isFinite(n) && n > 0) maxPages = n;
	}

  const requestedFields = 'Name,Icon,ClassJobCategory';
	let pagesProcessed = 0;
	let url = `${V2}/api/search?sheets=Action&fields=${requestedFields}&query=${encodeURIComponent(
		'+IsPlayerAction=true +IsPvP=false -ClassJobCategory=0'
	)}`;

  while (url && pagesProcessed <= maxPages) {
		const res = await getJSON<V2SearchResponse>(url);
		console.log(`Processing v2 page ${pagesProcessed + 1}, results: ${res.results.length}`);
		await processV2PageIntoCache(res, jobMap, jobCache);
    url = res.next ? `${V2}/api/search?cursor=${encodeURIComponent(res.next)}&fields=${requestedFields}` : '';
		pagesProcessed++;
	}

	// Sort and write back once
  for (const [abbr, entries] of jobCache.entries()) {
    entries.sort((a, b) => a.name.localeCompare(b.name));
    const filePath = jobMap.get(abbr);
    if (!filePath) {
      continue;
    }
    await writeJobJson(filePath, entries);
  }
}

async function processV2PageIntoCache(
	res: V2SearchResponse,
	jobMap: Map<string, string>,
	jobCache: Map<string, JobEntry[]>
): Promise<void> {
	for (const item of res.results) {
		const rowId = item.row_id;
		const name = item.fields.Name?.trim();
		if (!name) continue;
		const icon = item.fields.Icon;
		const cjcFields = item.fields.ClassJobCategory?.fields as Record<string, unknown> | undefined;
		const eligible = extractEligibleJobs(cjcFields);
		const eligiblePresent = eligible.filter((abbr) => jobMap.has(abbr));
		if (eligiblePresent.length === 0) continue; // no job files in our folder -> skip entirely (and do not store icon)

		// Ensure icon exists once if we have at least one target job
		await fetchAndStoreIconOnce(rowId, icon?.path, icon?.path_hr1);

		for (const abbr of eligiblePresent) {
			const list = jobCache.get(abbr);
			if (!list) continue;
			if (!hasRowId(list, rowId)) {
        console.log(`  Adding ${name} (${rowId}) to ${abbr}`);
				list.push({ row_id: rowId, name, icon: iconPathForRow(rowId) });
			}
      else {
        console.log(`  Skipping ${name} (${rowId}) for ${abbr}, already present`);
      }
		}
	}
}

// Allow running directly via tsx
const invokedPath = process.argv[1]?.replace(/\\/g, '/');
if (invokedPath?.endsWith('/scripts/update-jobs.ts') || import.meta.url.replace(/\\/g, '/').endsWith('/scripts/update-jobs.ts')) {
	updateJobFiles().catch((err) => {
		console.error(err);
		process.exitCode = 1;
	});
}

