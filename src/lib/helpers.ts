import type {KeyboardInput, GamepadInput} from "$lib/stores";

export function hasKeybind (input?: KeyboardInput | GamepadInput) {
  return formatKeybind(input) !== 'None'
}

export function formatKeybind (input?: KeyboardInput | GamepadInput) {
  if (!input) return 'None'
  
  // Gamepad input
  if ('button' in input) {
    return formatGamepadInput(input)
  }
  
  // Keyboard/mouse input
  const keys = []
  if ('ctrl' in input) keys.push('Ctrl')
  if ('shift' in input) keys.push('Shift')
  if ('alt' in input) keys.push('Alt')
  if ( 'mouse' in input && typeof input.mouse === 'number') keys.push(`Mouse${input.mouse + 1}`)
  if ('keyName' in input && input.keyName) keys.push(input.keyName)
  return keys.length ? keys.join('+') : 'None'
}

export function formatGamepadInput (gamepad: GamepadInput): string {
  const buttonNames: {[key: number]: string} = {
    0: 'A/Cross',
    1: 'B/Circle',
    2: 'X/Square',
    3: 'Y/Triangle',
    4: 'L1/LB',
    5: 'R1/RB',
    6: 'L2/LT',
    7: 'R2/RT',
    8: 'Select',
    9: 'Start',
    10: 'L3',
    11: 'R3',
    12: 'D-Up',
    13: 'D-Down',
    14: 'D-Left',
    15: 'D-Right',
    16: 'Home'
  }
  
  const parts = []
  if (gamepad.trigger !== undefined) {
    parts.push(buttonNames[gamepad.trigger] || `Btn${gamepad.trigger}`)
  }
  if (gamepad.button !== undefined) {
    parts.push(buttonNames[gamepad.button] || `Btn${gamepad.button}`)
  }
  return parts.join('+')
}

export function deriveKeyName (keyName: string, keyCode: string) {
  // For letter keys, use the actual key character to respect keyboard layout
  if (keyCode.startsWith('Key')) {
    // Use the key value (what the user sees) instead of physical position
    return keyName.toUpperCase()
  }
  if (keyCode.startsWith('Digit')) {
    return keyCode.slice(5)
  }
  const codes: {[key: string]: string} = {
    Backquote: '^',
    Equal: '´',
    Comma: ',',
    Slash: '-',
    Period: '.',
    Space: 'Space'
  }
  return codes[keyCode] || keyName
}

export function isModifierKey (keyName: string) {
  return ['Control', 'Shift', 'Alt', 'AltGraph'].includes(keyName)
}

export function isValidRotationName (name: string) {
  const trimmed = name.trim()
  if (trimmed.length === 0) {
    alert('Rotation name cannot be empty.')
    return false
  }
  if (trimmed.length > 50) {
    alert('Rotation name cannot be longer than 50 characters.')
    return false
  }
  return true
}

export function createSlug (name: string) {
  return name.toLowerCase().replaceAll(' ', '-').replace(/[^a-z0-9-]+/g, '').replace(/^-+|-+$/g, '').substring(0, 50)
}

// export const STORAGE_MAX = 5024 // 5MB
export const STORAGE_MAX = 5 * 1024 * 1024 // 5MB

/**
 * Calculates the approximate size of localStorage in bytes.
 * @returns The size of localStorage in bytes.
 */
export function getLocalStorageSize(): number {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += key.length + localStorage[key].length;
    }
  }
  return total * 2; // UTF-16 uses 2 bytes per character
}

/**
 * Gives a percentage of used localStorage with the assumption of 5MB quota.
 * @returns The estimated used storage quota in percentage.
 */
export function estimateStorageQuota(): number {
  const sizeBytes = getLocalStorageSize();
  return (sizeBytes / STORAGE_MAX) * 100;
}

/**
 * Returns a human-readable relative age string for a given past date.
 * Dates from the current day are shown as locale time, older dates as "X units ago".
 * @param date A past date 
 */
export function getRelativeAge(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMonths > 0) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  }
  if (diffDays > 0) {
    return `${diffDays}d ago`;
  }
  if (diffHours > 0) {
    return `${diffHours}h ago`;
  }
  if (diffMinutes > 0) {
    return `${diffMinutes}min ago`;
  }
  if (diffSeconds > 0) {
    return `${diffSeconds}s ago`;
  }
  return 'just now';
}

export function getLocalDateTimeString(date: Date): string {
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
