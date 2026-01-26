/**
 * XIVAPI v2 updater (test mode: first 2 pages only)
 * - Fetch Actions via v2 search (player actions only)
 * - For each action, inspect ClassJobCategory.fields to see which jobs can use it
 * - If a job JSON file exists under src/lib/assets/xiv/jobs/<job>.json, add the action
 *   to that file (appending { row_id, name, icon }) if not already present by row_id
 * - Download the icon once to src/lib/assets/xiv/actions/<row_id>.png using the v2 asset endpoint
 */

import {
	ensureDir,
	fileExists,
	getJSON,
	readJobJson,
	writeJobJson,
	hasRowId,
	jobsListToFileMap,
	extractEligibleJobs,
	iconPathForRow,
	fetchAndStoreIconOnce,
	JOBS_DIR,
	ACTIONS_DIR,
	V2,
	type JobEntry
} from './utils.ts';

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

async function updateJobFiles(): Promise<void> {
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

