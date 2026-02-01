import { browser } from '$app/environment';

export type MigrationFunction = {
  fromVersion: number
  toVersion: number
  migrate: () => void
}

const GLOBAL_VERSION_KEY = '__app_version';

let migrationsRun = false;

/**
 * Runs all pending migrations based on global version
 * Should be called once at app startup
 */
export function runMigrations(currentVersion: number) {
  if (!browser || migrationsRun) return;
  migrationsRun = true;

  try {
    const storedVersion = localStorage.getItem(GLOBAL_VERSION_KEY);
    const oldVersion = storedVersion ? Number.parseInt(storedVersion, 10) : 0;

    if (oldVersion >= currentVersion) {
      return
    }

    console.log(`[Migration] Running migrations: v${oldVersion} -> v${currentVersion}`);

    // Sort migrations by version
    const sortedMigrations = [...migrations].sort((a, b) => a.fromVersion - b.fromVersion);

    // Apply each migration in sequence
    for (const migration of sortedMigrations) {
      if (oldVersion <= migration.fromVersion && migration.fromVersion < currentVersion) {
        try {
          console.log(`[Migration] Applying: v${migration.fromVersion} -> v${migration.toVersion}`);
          migration.migrate();
        }
        catch (error) {
          console.error(
            `[Migration] Failed to apply migration ${migration.fromVersion} -> ${migration.toVersion}:`,
            error
          );
          throw error;
        }
      }
    }

    // Update global version
    localStorage.setItem(GLOBAL_VERSION_KEY, currentVersion.toString());
    console.log(`[Migration] Complete: now at v${currentVersion}`);
  }
  catch (error) {
    console.error('[Migration] Error during migrations:', error);
    throw error;
  }
}


const migrations: MigrationFunction[] = [
  {
    fromVersion: 0,
    toVersion: 1,
    migrate: () => {
      // Remove 'name' property from steps that have an 'action'
      // Name should only be used for custom actions (steps without action)
      const storedRotations = localStorage.getItem('rotations');
      if (storedRotations) {
        try {
          const rotations = JSON.parse(storedRotations);
          const migratedRotations = rotations.map((rotation: any) => ({
            ...rotation,
            steps: rotation.steps.map((step: any) => {
              if (step.action && step.name) {
                const { name, ...stepWithoutName } = step;
                return stepWithoutName;
              }
              return step;
            })
          }));
          localStorage.setItem('rotations', JSON.stringify(migratedRotations));
        } catch (error) {
          console.error('[Migration] Failed to migrate rotations:', error);
        }
      }
    }
  }
];