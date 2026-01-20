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
  if (input?.ctrl) keys.push('Ctrl')
  if (input?.shift) keys.push('Shift')
  if (input?.alt) keys.push('Alt')
  if (typeof input.mouse === 'number') keys.push(`Mouse${input.mouse + 1}`)
  if (input?.keyName) keys.push(input.keyName)
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
  parts.push(buttonNames[gamepad.button] || `Btn${gamepad.button}`)
  return parts.join('+')
}

export function isModifierKey (keyName: string) {
  return ['Control', 'Shift', 'Alt', 'AltGraph'].includes(keyName)
}

export function deriveKeyName (keyName: string, keyCode: string) {
  if (keyCode.startsWith('Key')) {
    return keyCode.slice(3)
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