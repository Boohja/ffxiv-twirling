/**
 * Shared utilities for XIVAPI v2 scripts
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { Jobs } from '../src/lib/types/jobs.ts';
import { actionLanguages, type JobAction } from '../src/lib/types/jobActions.ts';
import { V2ActionFields } from './update-jobs.ts';

const ROOT = process.cwd();
export const JOBS_DIR = path.join(ROOT, 'src', 'lib', 'assets', 'xiv', 'jobs');
export const ACTIONS_DIR = path.join(ROOT, 'src', 'lib', 'assets', 'xiv', 'actions');
export const V2 = 'https://v2.xivapi.com';


export async function ensureDir(dir: string): Promise<void> {
	await fs.mkdir(dir, { recursive: true });
}

export async function fileExists(p: string): Promise<boolean> {
	try {
		await fs.access(p);
		return true;
	} catch {
		return false;
	}
}

export async function getJSON<T>(url: string, retries = 3): Promise<T> {
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 60000); // 30 second timeout

			const res = await fetch(url, {
				headers: { 'user-agent': 'ffxiv-twirling/0.0.1 (+github.com/Boohja/ffxiv-twirling)' },
				signal: controller.signal
			});
			clearTimeout(timeoutId);

			if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
			return (await res.json()) as T;
		} catch (error) {
			if (attempt === retries) throw error;
			await sleep(2000 * attempt); // Exponential backoff
		}
	}
	throw new Error('Unreachable');
}

export async function getBinary(url: string, retries = 3): Promise<Uint8Array> {
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

			const res = await fetch(url, {
				headers: { 'user-agent': 'ffxiv-twirling/0.0.1 (+github.com/Boohja/ffxiv-twirling)' },
				signal: controller.signal
			});
			clearTimeout(timeoutId);

			if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
			const ab = await res.arrayBuffer();
			return new Uint8Array(ab);
		} catch (error) {
			if (attempt === retries) throw error;
			await sleep(2000 * attempt); // Exponential backoff
		}
	}
	throw new Error('Unreachable');
}

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function readJobJson(filePath: string): Promise<JobAction[]> {
	try {
		const txt = await fs.readFile(filePath, 'utf8');
		const data = txt.trim() ? (JSON.parse(txt) as JobAction[]) : [];
		return Array.isArray(data) ? data : [];
	} catch (e) {
		const err = e as NodeJS.ErrnoException;
		if (err && err.code === 'ENOENT') return [];
		console.warn(`Failed to read ${filePath}: ${err?.message}`);
		throw e;
	}
}

export async function writeJobJson(filePath: string, entries: JobAction[]): Promise<void> {
	const txt = JSON.stringify(entries, null, 2) + '\n';
	await fs.writeFile(filePath, txt, 'utf8');
}

export function hasRowId(entries: JobAction[], id: number): boolean {
	return entries.some((e) => e.id === id);
}

export function hasActionName(entries: JobAction[], name: string): boolean {
	return entries.some((e) => e.name.en.toLowerCase() === name.toLowerCase());
}

/**
 * Adds new or updates existing entries based on `rowId` in the given job's entries.
 * @returns true if an entry was added/updated.
 */
export function handleActionRow(entries: JobAction[], rowId: number, fields: V2ActionFields, job: string): boolean {
	const entry = entries.find((e) => e.id === rowId);
	if (!entry) {
		console.log(`  Adding ${fields.Name} (${rowId}) to ${job}`);
		entries.push({
			id: rowId,
			name: {
				en: fields.Name!.trim(),
				fr: fields['Name@lang(fr)']!.trim(),
				de: fields['Name@lang(de)']!.trim(),
				ja: fields['Name@lang(ja)']!.trim()
			},
			icon: iconPathForRow(rowId)
		});
		return true;
	}
	else if (Object.keys(entry.name).length !== actionLanguages.length || Object.values(entry.name).some((n) => !n.trim())) {
		console.log(`  Updating names for ${fields.Name} (${rowId}) in ${job}`);
		entry.name = {
			en: fields.Name!.trim(),
			fr: fields['Name@lang(fr)']!.trim(),
			de: fields['Name@lang(de)']!.trim(),
			ja: fields['Name@lang(ja)']!.trim()
		};
		return true;
	}
	else {
		console.log(`  Skipping ${fields.Name} (${rowId}) for ${job}, already present`);
	}
	return false;
}

// Build a map of job ABBR (uppercase) -> json file path using exported Jobs list
export function jobsListToFileMap(): Map<string, string> {
	const map = new Map<string, string>();
	for (const j of Jobs) {
		const abbr = j.id.toUpperCase();
		const filePath = path.join(JOBS_DIR, `${j.id}.json`);
		map.set(abbr, filePath);
	}
	return map;
}

export function extractEligibleJobs(fields?: Record<string, unknown>): string[] {
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

export function iconPathForRow(rowId: number): string {
	return `actions/${rowId}.png`;
}

export async function fetchAndStoreIconOnce(
	rowId: number,
	iconPath: string | undefined,
	iconPathHr1: string | undefined
): Promise<void> {
	const outPath = path.join(ACTIONS_DIR, `${rowId}.png`);
	try {
		await fs.access(outPath);
		return; // already exists
	} catch {
		// proceed
	}
	const src = iconPathHr1 || iconPath;
	if (!src) return;
	const url = `${V2}/api/asset?path=${encodeURIComponent(src)}&format=png`;
	const bin = await getBinary(url);
	await fs.writeFile(outPath, bin);
	await sleep(1500);
}
