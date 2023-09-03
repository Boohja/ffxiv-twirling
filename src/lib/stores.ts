import { persisted } from 'svelte-local-storage-store'

export interface RotationStep {
  name: string,
  icon: string,
  duration?: number,
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
  job?: string,
  steps: RotationStep[]
}

const emptyRotations: Rotation[] = []

export const rotations = persisted('rotations', emptyRotations)