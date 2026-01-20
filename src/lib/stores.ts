import { persisted } from 'svelte-persisted-store'

export interface RotationStep {
  /** Name shown in the rotation (either custom name or action name) */
  name: string,
  /** if `action` is present, path relative to `$lib/assets/xiv`, otherwise `/images/skills/` */
  icon: string,
  duration?: number,
  /** For ff14 actions the corresponding `row_id` provided by xivapi */
  action?: number
  /** The input to trigger this step (keyboard/mouse or gamepad) */
  input?: KeyboardInput | GamepadInput
}

export type GamepadInput = {
  button: number
  trigger?: number // L1(4), R1(5), L2(6), R2(7)
}

export type KeyboardInput = {
  shift?: boolean
  ctrl?: boolean
  alt?: boolean
  mouse?: number
  keyName?: string
  keyCode?: string
}

export interface Rotation {
  name: string,
  job: string,
  slug: string,
  steps: RotationStep[]
  input?: 'keyboard' | 'gamepad'
  gamepadLayout?: 'ps' | 'xbox'
}

const emptyRotations: Rotation[] = []

export const rotations = persisted('rotations', emptyRotations)