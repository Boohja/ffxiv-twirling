import type {RotationStepKey} from "$lib/stores";

export function hasKeybind (keybind?: RotationStepKey) {
  return formatKeybind(keybind) !== 'None'
}

export function formatKeybind (keybind?: RotationStepKey) {
  const keys = []
  if (keybind?.ctrl) keys.push('Ctrl')
  if (keybind?.shift) keys.push('Shift')
  if (keybind?.alt) keys.push('Alt')
  if (keybind && typeof keybind.mouse === 'number') keys.push(`Mouse${keybind.mouse + 1}`)
  if (keybind?.keyName) keys.push(keybind.keyName)
  return keys.length ? keys.join('+') : 'None'
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