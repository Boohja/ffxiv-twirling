/**
 * Sync job actions from a GitHub TypeScript file
 * 
 * Automatically compares a GitHub TypeScript file against local JSON
 * and fetches any missing action IDs from XIVAPI
 * 
 * Run with: npm run sync:actions -- <job> <github-url>
 * Example: npm run sync:actions -- smn https://github.com/x.../SMN.ts
 */

import path from 'node:path';
import {
	ensureDir,
	fileExists,
	getJSON,
	readJobJson,
	writeJobJson,
	jobsListToFileMap,
	extractEligibleJobs,
	fetchAndStoreIconOnce,
	findMissingActions,
	ACTIONS_DIR,
	JOBS_DIR,
	V2,
	handleActionRow,
	sleep
} from './utils.ts';
import { V2ActionFields } from './update-jobs.ts';

type V2ActionResponse = {
	row_id: number;
	fields: V2ActionFields;
};

type V2BatchResponse = {
	rows: V2ActionResponse[];
};

/**
 * Fetch and add multiple actions in a single batch request
 */
async function fetchAndAddActionsBatch(rowIds: number[], jobFilePath: string, jobAbbr: string): Promise<number> {
	const rowsParam = rowIds.join(',');
	const url = `${V2}/api/sheet/Action?rows=${rowsParam}&fields=Name,Name@lang(fr),Name@lang(de),Name@lang(ja),Icon,ClassJobCategory`;
	
	const response = await getJSON<V2BatchResponse>(url);
	const entries = await readJobJson(jobFilePath);
	let added = 0;

	for (const action of response.rows) {
		const fields: V2ActionFields = action.fields;
		const name = fields.Name?.trim();
		
		if (!name) {
			console.warn(`  ⚠ Action ${action.row_id} has no name, skipping`);
			continue;
		}

		console.log(`  ✓ Fetched ${name} (${action.row_id})`);

		// Download icon
		await fetchAndStoreIconOnce(action.row_id, fields.Icon?.path, fields.Icon?.path_hr1);

		if (handleActionRow(entries, action.row_id, fields, jobAbbr)) {
			added++;
		}
	}

	entries.sort((a, b) => a.name.en.localeCompare(b.name.en));
	await writeJobJson(jobFilePath, entries);
	return added;
}

async function syncJobActions(jobId: string, githubUrl: string): Promise<void> {
	await ensureDir(ACTIONS_DIR);

	// Normalize job ID
	const jobIdLower = jobId.toLowerCase();
	const jobUpper = jobId.toUpperCase();
	const jobMap = jobsListToFileMap();

	if (!jobMap.has(jobUpper)) {
		console.error(`Error: Job "${jobId}" not found. Available jobs: ${Array.from(jobMap.keys()).join(', ')}`);
		process.exit(1);
	}

	const jobFilePath = jobMap.get(jobUpper)!;

	if (!(await fileExists(jobFilePath))) {
		console.log(`Creating new job file: ${jobIdLower}.json`);
		await writeJobJson(jobFilePath, []);
	}

	console.log(`\n📦 Syncing ${jobIdLower.toUpperCase()} from: ${githubUrl}\n`);

	// Find missing actions
	let missingIds: number[];
	try {
		missingIds = await findMissingActions(jobFilePath, githubUrl);
	} catch (error) {
		console.error(`Error fetching or parsing GitHub file: ${(error as Error).message}`);
		process.exit(1);
	}

	if (missingIds.length === 0) {
		console.log(`✨ All actions already up to date! (${(await readJobJson(jobFilePath)).length} actions)`);
		return;
	}

	console.log(`Found ${missingIds.length} missing action(s):`);
	console.log(`  ${missingIds.join(', ')}\n`);
	console.log(`Fetching from XIVAPI...\n`);

	// Fetch all missing actions in a single batch request
	try {
		const added = await fetchAndAddActionsBatch(missingIds, jobFilePath, jobUpper);
		const finalCount = (await readJobJson(jobFilePath)).length;
		console.log(`\n✅ Done! Added ${added}/${missingIds.length} action(s). Total: ${finalCount} actions`);
	} catch (error) {
		console.error(`Failed to fetch actions: ${(error as Error).message}`);
		process.exit(1);
	}
}

// Parse command line arguments
const jobId = process.argv[2];
const githubUrl = process.argv[3];

if (!jobId || !githubUrl) {
	console.error('Error: Both job ID and GitHub URL are required');
	console.log('Usage: npm run sync:actions -- <job> <github-url>');
	console.log('Example: npm run sync:actions -- smn https://github.com/.../SMN.ts');
	process.exit(1);
}

syncJobActions(jobId, githubUrl).catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
