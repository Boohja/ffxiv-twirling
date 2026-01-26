import { persisted } from 'svelte-persisted-store'
import type { TwirlSettings } from './types/twirl';
import { createDefaultTwirlSettings } from './types/twirl';

export type CombinedInput = KeyboardInput & GamepadInput & MouseInput;

export interface RotationStep {
  /** Name shown in the rotation (either custom name or action name) */
  name: string,
  /** if `action` is present, path relative to `$lib/assets/xiv`, otherwise `/images/skills/` */
  icon: string,
  duration?: number,
  /** For ff14 actions the corresponding `row_id` provided by xivapi */
  action?: number
  /** The input to trigger this step (keyboard/mouse or gamepad) */
  input?: CombinedInput
}

export type GamepadInput = {
  button?: number
  trigger?: number // L1(4), R1(5), L2(6), R2(7)
}

export type MouseInput = {
  mouse?: number
}

export type KeyboardInput = {
  shift?: boolean
  ctrl?: boolean
  alt?: boolean
  keyName?: string
  keyCode?: string
}

export interface Rotation {
  name: string,
  job: string,
  slug: string,
  steps: RotationStep[]
  createdAt: string,
  updatedAt: string,
  lastTwirlAt?: string
}

export interface RotationTemplate extends Rotation {
  url: string,
  updated: string
}

const emptyRotations: Rotation[] = []

export const rotations = persisted('rotations', emptyRotations)


export type TwirlRecording = {
  // the config that was used for this twirl
  config: TwirlSettings
  // when the twirl was recorded
  startedAt: string
  // when the twirl recording ended
  endedAt: string
  // the associated rotation
  rotation: {
    slug: string
    name: string
    job: string
  }
  // the recorded steps
  steps: TwirlStep[]
  // total duration in ms to complete the twirl
  duration: number
  // whether the twirl was completed successfully
  correct: boolean
  // whether the twirl recording was finished
  finished?: boolean
}

export type TwirlStep = {
  // the original step from the rotation
  original: RotationStep
  // the recorded inputs for this step
  inputs: TwirlInput[]
  // total duration in ms to complete this step
  duration: number
  // true if a correct input was provided
  correct: boolean
  // true if the configured timeout was reached
  timeout?: boolean
}

export type TwirlInput = {
  // the users recorded input
  input: CombinedInput
  // time since previous input in milliseconds
  delta: number
  // whether the input was correct for this step
  correct: boolean
}

const emptyTwirls: TwirlRecording[] = []

export const twirls = persisted('twirls', emptyTwirls)

export const twirlConfig = persisted('twirlConfig', createDefaultTwirlSettings())