/**
 * Add a single action to job files by row_id
 * Run with: npm run update:action -- <row_id>
 * Example: npm run update:action -- 16479
 * 
 * Check https://github.com/xivanalysis/xivanalysis/tree/dawntrail/src/data/ACTIONS/root for the correct id.
 */

import {
	ensureDir,
	fileExists,
	getJSON,
	readJobJson,
	writeJobJson,
	hasActionName,
	jobsListToFileMap,
	extractEligibleJobs,
	iconPathForRow,
	fetchAndStoreIconOnce,
	ACTIONS_DIR,
	V2
} from './utils.ts';

type V2ActionResponse = {
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
};

async function updateAction(rowId: number): Promise<void> {
	await ensureDir(ACTIONS_DIR);

	const url = `${V2}/api/sheet/Action/${rowId}?fields=Name,Icon,ClassJobCategory`;
	console.log(`Fetching action ${rowId}...`);
	const action = await getJSON<V2ActionResponse>(url);

	const name = action.fields.Name?.trim();
	if (!name) {
		console.error(`Error: Action ${rowId} has no name`);
		process.exit(1);
	}

	console.log(`Action: ${name} (${rowId})`);

	const cjcFields = action.fields.ClassJobCategory?.fields as Record<string, unknown> | undefined;
	const eligible = extractEligibleJobs(cjcFields);

	if (eligible.length === 0) {
		console.error(`Error: Action ${rowId} (${name}) has no eligible jobs`);
		process.exit(1);
	}

	console.log(`Eligible jobs: ${eligible.join(', ')}`);

	const jobMap = jobsListToFileMap();
	const eligiblePresent = eligible.filter((abbr) => jobMap.has(abbr));

	if (eligiblePresent.length === 0) {
		console.error(`Error: None of the eligible jobs have JSON files in the project`);
		process.exit(1);
	}

	// Check if action already exists in any of the target job files
	for (const abbr of eligiblePresent) {
		const filePath = jobMap.get(abbr);
		if (!filePath) continue;

		if (!(await fileExists(filePath))) {
			console.log(`Creating new job file: ${abbr.toLowerCase()}.json`);
			await writeJobJson(filePath, []);
		}

		const entries = await readJobJson(filePath);
		if (hasActionName(entries, name)) {
			console.log(`✓ Action "${name}" already exists in ${abbr}`);
			continue;
		}

		// Download icon once (shared across all jobs)
		await fetchAndStoreIconOnce(rowId, action.fields.Icon?.path, action.fields.Icon?.path_hr1);

		// Add action to job file
		entries.push({ row_id: rowId, name, icon: iconPathForRow(rowId) });
		entries.sort((a, b) => a.name.localeCompare(b.name));
		await writeJobJson(filePath, entries);
		console.log(`✓ Added "${name}" to ${abbr}`);
	}

	console.log('Done!');
}

// Parse command line arguments
const actionId = process.argv[2];

if (!actionId) {
	console.error('Error: Action ID is required');
	console.log('Usage: npm run update:action -- <actionId>');
	process.exit(1);
}

const rowId = Number(actionId);
if (!Number.isInteger(rowId) || rowId <= 0) {
	console.error(`Error: Invalid action ID "${actionId}". Must be a positive integer.`);
	process.exit(1);
}

updateAction(rowId).catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
