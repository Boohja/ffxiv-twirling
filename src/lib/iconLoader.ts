/**
 * Icon and Job Data Loader Utility
 * 
 * Provides centralized functionality for loading XIV asset icons and job data.
 */

const iconModules = import.meta.glob<string>('/src/lib/assets/xiv/**/*.png', { 
  eager: true, 
  as: 'url' 
})

const gamepadButtonModules = import.meta.glob<string>('/src/lib/assets/gamepad/**/*.png', { 
  eager: true, 
  as: 'url' 
})

const jobJsonModules = import.meta.glob('$lib/assets/xiv/jobs/*.json') as Record<
  string, 
  () => Promise<{ default: any }>
>

/**
 * Get the URL for an icon by its relative path within the xiv assets directory
 * 
 * @param iconPath - Relative path like "jobs/drk.png" or "actions/someskill.png"
 * @returns The resolved URL for the icon, or empty string if not found
 * 
 * @example
 * const url = getIconUrl('jobs/drk.png')
 * const actionUrl = getIconUrl('actions/106.png')
 */
export function getIconUrl(iconPath: string): string {
  const key = '/src/lib/assets/xiv/' + iconPath.replace(/^\/+/, '')
  return iconModules[key] ?? ''
}

/**
 * Get all eagerly loaded icon modules
 * 
 * @returns Record mapping full paths to icon URLs
 */
export function getAllIconModules(): Record<string, string> {
  return iconModules
}

/**
 * Create a job-to-loader map indexed by job ID (basename without extension)
 * 
 * @returns Record mapping job IDs to their JSON loader functions
 * 
 * @example
 * const loaders = getJobLoaders()
 * const drkData = await loaders['drk']()
 */
export function getJobLoaders(): Record<string, () => Promise<{ default: any }>> {
  return Object.fromEntries(
    Object.entries(jobJsonModules).map(([path, loader]) => {
      const file = path.split('/').pop() || ''
      const id = file.replace(/\.json$/i, '')
      return [id, loader]
    })
  )
}

/**
 * Load job action data by job ID
 * 
 * @param jobId - The job identifier (e.g., 'drk', 'ast', 'sam')
 * @returns Promise resolving to array of job actions, or empty array if not found
 * 
 * @example
 * const actions = await loadJobActions('drk')
 * console.log(actions) // [{ name: 'Bloodspiller', ... }, ...]
 */
export async function loadJobActions(jobId: string): Promise<any[]> {
  const loaders = getJobLoaders()
  const loader = loaders[jobId]
  if (!loader) return []
  
  const mod = await loader()
  return mod?.default ?? []
}

/**
 * Get a map of job IDs to their icon URLs
 * Useful for displaying job selection interfaces
 * 
 * @returns Record mapping job IDs to icon URLs
 * 
 * @example
 * const jobIcons = getJobIconUrls()
 * <img src={jobIcons['drk']} alt="Dark Knight" />
 */
export function getJobIconUrls(): Record<string, string> {
  const jobIconModules = import.meta.glob<string>('$lib/assets/xiv/jobs/*.png', { 
    eager: true, 
    as: 'url' 
  })
  
  const jobIconUrl: Record<string, string> = {}
  for (const path in jobIconModules) {
    const base = path.split('/').pop() || ''
    const id = base.replace(/\.png$/i, '')
    jobIconUrl[id] = jobIconModules[path]
  }
  
  return jobIconUrl
}

/**
 * Get the icon URL for a specific job
 * 
 * @param jobId - The job identifier (e.g., 'drk', 'ast', 'sam')
 * @returns The icon URL for the job, or empty string if not found
 * 
 * @example
 * const drkIcon = getJobIconUrl('drk')
 * <img src={drkIcon} alt="Dark Knight" />
 */
export function getJobIconUrl(jobId: string): string {
  return getIconUrl(`jobs/${jobId}.png`)
}

/**
 * Get the URL for a gamepad button icon
 * 
 * @param layout - The gamepad layout ('ps' or 'xbox')
 * @param buttonIndex - The button index (0-3 for face buttons)
 * @param large - Whether to use the large icon (132px). Defaults to false (44px)
 * @returns The resolved URL for the button icon, or empty string if not found
 * 
 * @example
 * const url = getGamepadButtonUrl('ps', 0) // Cross button (44px)
 * const url = getGamepadButtonUrl('xbox', 1, true) // B button (132px)
 */
export function getGamepadButtonUrl(layout: 'ps' | 'xbox', buttonIndex: number, large: boolean = false): string {
  const suffix = large ? 'XL' : ''
  const key = `/src/lib/assets/gamepad/${layout}/${buttonIndex}${suffix}.png`
  return gamepadButtonModules[key] ?? ''
}
