import { persisted } from 'svelte-persisted-store'

export interface RotationStep {
  /** Name shown in the rotation (either custom name or action name) */
  name: string,
  /** if `action` is present, path relative to `$lib/assets/xiv`, otherwise `/images/skills/` */
  icon: string,
  duration?: number,
  /** For ff14 actions the corresponding `row_id` provided by xivapi */
  action?: number
  /** The keybind to trigger this step */
  key?: RotationStepKey
}

export type RotationStepKey = {
  shift: boolean
  ctrl: boolean
  alt: boolean
  mouse?: false | number
  keyName?: string
  keyCode?: string
}

export interface Rotation {
  name: string,
  job: string,
  slug: string,
  steps: RotationStep[]
}

const emptyRotations: Rotation[] = []

export const rotations = persisted('rotations', emptyRotations)