import { persisted } from 'svelte-local-storage-store'

export interface RotationStep {
  name: string,
  key?: string
}

export interface RotationSkill {
  id: number,
  name: string,
  icon?: string,
  key?: string
}

export interface Rotation {
  name: string,
  job?: string,
  steps: RotationStep[]
}

const emptyRotations: Rotation[] = []

export const rotations = persisted('rotations', emptyRotations)