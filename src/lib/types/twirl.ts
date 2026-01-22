export type ErrorBehavior = 'stay' | 'continue' | 'restart'

export interface TwirlSettings {
  showName: boolean
  showIcon: boolean
  showKeybind: boolean
  playSounds: boolean
  volume: number
  errorBehavior: ErrorBehavior
  timeout: number
}

export function createDefaultTwirlSettings(): TwirlSettings {
  return {
    showName: true,
    showIcon: true,
    showKeybind: true,
    playSounds: true,
    volume: 0.5,
    errorBehavior: 'stay',
    timeout: 0
  }
}
