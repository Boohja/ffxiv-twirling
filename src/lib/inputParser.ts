import type { CombinedInput, GamepadInput, KeyboardInput, MouseInput } from "./stores";
import { deriveKeyName, isModifierKey } from "./helpers";

export type DetectedInput = KeyboardInput & GamepadInput & MouseInput;
export const blacklistedKeyboardCodes = ['Enter', 'F5'];
export const blacklistedGamepadButtons = [99];
export const blacklistedMouseButtons = [0]; // Left click

const comboGamepadButtons = new Set([4, 5, 6, 7]); // L1, R1, L2, R2
const eventTypes = ['validSnapshot', 'cancelInput', 'processed', 'released'] as const;
type EventType = typeof eventTypes[number];

export class InputSnapshot {
  currentKeyboardInput: KeyboardInput;
  currentMouseInput: MouseInput;
  currentGamepadInput: GamepadInput;
  currentInput: DetectedInput;
  lastEmittedInput: DetectedInput | null = null;
  eventHandlers: { [key in EventType]?: (input: DetectedInput) => void } = {};
  
  // Gamepad state tracking
  private pressedButtons: Set<number> = new Set();
  private firstPressedButton: number | null = null;

  constructor() {
    this.currentKeyboardInput = {};
    this.currentGamepadInput = {};
    this.currentMouseInput = {};
    this.currentInput = {};
  }

  processKeyboardEvent = (event: KeyboardEvent) => {
    this.currentKeyboardInput = parseKeyboardEvent(event);
    this.currentInput = {
      ...this.currentKeyboardInput,
      ...this.currentGamepadInput,
      ...this.currentMouseInput
    };
    this.#processAndEmit();
  }

  processMouseEvent = (event: MouseEvent) => {
    this.currentMouseInput = parseMouseEvent(event);
    this.currentInput = {
      ...this.currentKeyboardInput,
      ...this.currentGamepadInput,
      ...this.currentMouseInput
    };
    this.#processAndEmit();
  }

  processGamepads(gamepads: (Gamepad | null)[]) {
    const result = parseGamepads(gamepads, this.pressedButtons, this.firstPressedButton);
    if (result) {
      this.currentGamepadInput = result.input;
      this.pressedButtons = result.pressedButtons;
      this.firstPressedButton = result.firstPressedButton;
    } else {
      this.currentGamepadInput = {};
      this.pressedButtons.clear();
      this.firstPressedButton = null;
    }
    this.currentInput = {
      ...this.currentKeyboardInput,
      ...this.currentGamepadInput,
      ...this.currentMouseInput
    };
    this.#processAndEmit();
  }

  /**
   * Callback for when a valid input snapshot is detected.
   * @param callback 
   */
  onValidSnapshot(callback: (input: DetectedInput) => void) {
    this.eventHandlers['validSnapshot'] = callback;
  }

  /**
   * Callback for when the input is a cancel command.
   * @param callback 
   */
  onCancelInput(callback: (input: DetectedInput) => void) {
    this.eventHandlers['cancelInput'] = callback;
  }

  /**
   * Callback for when an input has been processed - can be valid or not.
   * @param callback 
   */
  onProcessed(callback: (input: DetectedInput) => void) {
    this.eventHandlers['processed'] = callback;
  }

  /**
   * Callback for when all inputs have been released.
   * @param callback 
   */
  onRelease(callback: (input: DetectedInput) => void) {
    this.eventHandlers['released'] = callback;
  }

  /**
   * Determines if the current input should cancel the ongoing action.
   * @returns True if the input is a cancel command, false otherwise.
   */
  shouldCancel(): boolean {
    return this.currentKeyboardInput.keyCode === 'Escape' || this.currentGamepadInput.button === 9;
  }

  isComplete(): boolean {
    return !!this.currentKeyboardInput.keyCode || this.currentGamepadInput.button !== undefined || this.currentMouseInput.mouse !== undefined;
  }

  /**
   * Checks if the given input matches the current snapshot.
   * @returns true if the input matches, false otherwise.
   */
  doesMatch(input: CombinedInput): boolean {
    return input.alt === this.currentInput.alt &&
           input.ctrl === this.currentInput.ctrl &&
           input.shift === this.currentInput.shift &&
           input.keyCode === this.currentInput.keyCode &&
           input.keyName === this.currentInput.keyName &&
           input.button === this.currentInput.button &&
           input.trigger === this.currentInput.trigger &&
           input.mouse === this.currentInput.mouse;
  }


  reset() {
    this.currentKeyboardInput = {};
    this.currentGamepadInput = {};
    this.currentMouseInput = {};
    this.currentInput = {};
    this.lastEmittedInput = null;
    this.pressedButtons.clear();
    this.firstPressedButton = null;
  }


  #processAndEmit() {
    // Avoid emitting duplicate inputs
    if (JSON.stringify(this.currentInput) === JSON.stringify(this.lastEmittedInput)) {
      return;
    }
    const previousInput = this.lastEmittedInput ?? {};
    this.lastEmittedInput = this.currentInput;
    if (Object.keys(this.currentInput).length === 0 && Object.keys(previousInput).length > 0) {
      this.eventHandlers['released']?.(this.currentInput);
      return;
    }
    console.log(JSON.stringify(this.currentInput));
    if (this.shouldCancel()) {
      this.eventHandlers['cancelInput']?.(this.currentInput);
      return;
    }
    if (this.isComplete()) {
      this.eventHandlers['validSnapshot']?.(this.currentInput);
      return;
    }
    if (Object.keys(this.currentInput).length > 0) {
      this.eventHandlers['processed']?.(this.currentInput);
    }
  }
}



function parseKeyboardEvent(event: KeyboardEvent): KeyboardInput {
  event.preventDefault();
  const input: KeyboardInput = {};
  
  if (event.ctrlKey) input.ctrl = true;
  if (event.shiftKey) input.shift = true;
  if (event.altKey) input.alt = true;

  // if (blacklistedKeyboardCodes.includes(event.code)) {
  //   return input;
  // }

  if (!isModifierKey(event.key) && event.type === 'keydown') {
    input.keyCode = event.code;
    input.keyName = deriveKeyName(event.key, event.code);
  }

  return input;
}

function parseMouseEvent(event: MouseEvent): MouseInput {
  event.preventDefault();
  const input: MouseInput = {};
  if (blacklistedMouseButtons.includes(event.button)) {
    return input;
  }
  if (event.type === 'mousedown') {
    input.mouse = event.button;
  }
  return input;
}


function parseGamepads(
  gamepads: (Gamepad | null)[],
  previousPressed: Set<number>,
  previousFirstButton: number | null
): { input: GamepadInput, pressedButtons: Set<number>, firstPressedButton: number | null } | null {

  const gamepad = gamepads.find(gp => gp?.buttons.some(btn => btn.pressed));
  if (!gamepad) return null;

  const currentPressed: Set<number> = new Set();
  let firstPressedButton = previousFirstButton;
  let mainButton: number | undefined = undefined;
  let triggerButton: number | undefined = undefined;

  // Collect currently pressed buttons (excluding blacklisted)
  gamepad.buttons.forEach((button, index) => {
    if (button.pressed && !blacklistedGamepadButtons.includes(index)) {
      currentPressed.add(index);
    }
  });

  // Detect newly pressed buttons
  const newPresses: number[] = [];
  currentPressed.forEach(btn => {
    if (!previousPressed.has(btn)) {
      newPresses.push(btn);
    }
  });

  // Track the very first button pressed in this sequence
  if (newPresses.length > 0 && firstPressedButton === null) {
    firstPressedButton = newPresses[0];
  }

  // Reset first button when all buttons are released
  if (currentPressed.size === 0) {
    firstPressedButton = null;
  }

  // Process combo logic
  if (currentPressed.size > 0) {
    // Find the first non-combo button pressed
    const nonComboButtons = Array.from(currentPressed).filter(btn => !comboGamepadButtons.has(btn));
    if (nonComboButtons.length > 0) {
      // Use the first one that was pressed (if tracked), otherwise fall back to first in array
      mainButton = nonComboButtons.find(btn => btn === firstPressedButton) || nonComboButtons[0];
    }

    // Check for trigger (combo button)
    const comboButtons = Array.from(currentPressed).filter(btn => comboGamepadButtons.has(btn));
    if (comboButtons.length > 0) {
      // Valid combo: first pressed button must be a combo button
      if (firstPressedButton !== null && comboGamepadButtons.has(firstPressedButton)) {
        triggerButton = firstPressedButton;
      }
    }
  }

  const input: GamepadInput = {};
  if (mainButton !== undefined) {
    input.button = mainButton;
  }
  if (triggerButton !== undefined && triggerButton !== mainButton) {
    input.trigger = triggerButton;
  }

  return {
    input,
    pressedButtons: currentPressed,
    firstPressedButton
  }
}


