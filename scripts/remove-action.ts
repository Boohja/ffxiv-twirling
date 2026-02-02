/**
 * Remove an action from a job file and optionally its icon
 * 
 * Run with: npm run remove:action -- <job> <action_id>
 * Example: npm run remove:action -- drg 95
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import {
	fileExists,
	readJobJson,
	writeJobJson,
	jobsListToFileMap,
	ACTIONS_DIR,
	JOBS_DIR
} from './utils.ts';

/**
 * Check if an action ID is used in any other job files
 */
async function isActionUsedElsewhere(actionId: number, excludeJobFile: string): Promise<boolean> {
	const jobMap = jobsListToFileMap();
	
	for (const [jobAbbr, filePath] of jobMap.entries()) {
		if (filePath === excludeJobFile) continue;
		
		if (!(await fileExists(filePath))) continue;
		
		const entries = await readJobJson(filePath);
		if (entries.some(e => e.id === actionId)) {
			return true;
		}
	}
	
	return false;
}

/**
 * Remove an action from a job file
 */
async function removeAction(jobId: string, actionId: number): Promise<void> {
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
		console.error(`Error: Job file not found: ${jobFilePath}`);
		process.exit(1);
	}

	// Read current entries
	const entries = await readJobJson(jobFilePath);
	const actionIndex = entries.findIndex(e => e.id === actionId);

	if (actionIndex === -1) {
		console.error(`Error: Action ${actionId} not found in ${jobUpper} job file`);
		process.exit(1);
	}

	const action = entries[actionIndex];
	console.log(`\nRemoving action: ${action.name.en} (${actionId}) from ${jobUpper}`);

	// Remove the action
	entries.splice(actionIndex, 1);
	await writeJobJson(jobFilePath, entries);
	console.log(`✓ Removed from ${jobIdLower}.json`);

	// Handle icon removal
	const iconPath = path.join(ACTIONS_DIR, `${actionId}.png`);
	const iconExists = await fileExists(iconPath);

	if (!iconExists) {
		console.log(`✓ Icon ${actionId}.png not found (already removed or never existed)`);
		return;
	}

	// Check if icon is used by other jobs
	const usedElsewhere = await isActionUsedElsewhere(actionId, jobFilePath);

	if (usedElsewhere) {
		console.log(`⚠ Icon ${actionId}.png is used by other jobs, keeping it`);
	} else {
		await fs.unlink(iconPath);
		console.log(`✓ Removed icon ${actionId}.png`);
	}

	console.log(`\n✅ Done! Action ${actionId} removed from ${jobUpper}`);
}

// Parse command line arguments
const jobId = process.argv[2];
const actionIdArg = process.argv[3];

if (!jobId || !actionIdArg) {
	console.error('Error: Both job ID and action ID are required');
	console.log('Usage: npm run remove:action -- <job> <action_id>');
	console.log('Example: npm run remove:action -- drg 95');
	process.exit(1);
}

const actionId = Number(actionIdArg);
if (!Number.isInteger(actionId) || actionId <= 0) {
	console.error(`Error: Invalid action ID "${actionIdArg}". Must be a positive integer.`);
	process.exit(1);
}

removeAction(jobId, actionId).catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
