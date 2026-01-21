import type { KeyboardInput, GamepadInput } from "$lib/stores";
import { deriveKeyName, isModifierKey } from "$lib/helpers";

export type InputCaptureCallback = (input: KeyboardInput | GamepadInput) => void;
export type CancelCallback = () => void;

export interface InputCaptureOptions {
  onInput: InputCaptureCallback;
  onCancel?: CancelCallback;
  cancellable?: boolean;
  emitImmediately?: boolean;
  blacklistedKeyboardCodes?: string[];
  blacklistedGamepadButtons?: number[];
  blacklistedMouseButtons?: number[];
}

export class InputCapture {
  private recording = false;
  private waitingForRelease = false;
  private ignoreUntilRelease = false;
  
  // Keyboard/mouse state
  private shift = false;
  private alt = false;
  private ctrl = false;
  private mouse: number | undefined = undefined;
  private keyCode = "";
  private keyName = "";
  private activeKeys: Set<string> = new Set();
  
  // Gamepad state
  private detectedGamepad: Gamepad | null = null;
  private pressedButtons: Set<number> = new Set();
  private firstPressedButton: number | null = null;
  private gamepadAnimationFrameId: number | null = null;
  
  private pendingSnapshot: KeyboardInput | GamepadInput | undefined = undefined;
  
  private options: InputCaptureOptions;
  
  constructor(options: InputCaptureOptions) {
    this.options = {
      cancellable: false,
      emitImmediately: false,
      blacklistedKeyboardCodes: options.cancellable ? ['Enter', 'F5'] : ['Escape', 'Enter', 'F5'],
      blacklistedGamepadButtons: options.cancellable ? [8] : [8, 9],
      blacklistedMouseButtons: [0],
      ...options
    };
  }
  
  start() {
    if (this.recording) return;
    
    this.recording = true;
    this.pendingSnapshot = undefined;
    this.waitingForRelease = false;
    this.ignoreUntilRelease = false;
    this.activeKeys.clear();
    
    // Reset keyboard/mouse state
    this.shift = false;
    this.alt = false;
    this.ctrl = false;
    this.mouse = undefined;
    this.keyCode = "";
    this.keyName = "";
    
    if (typeof window !== 'undefined') {
      window.addEventListener("keydown", this.handleKeyboardMouseEvent);
      window.addEventListener("keyup", this.handleKeyboardMouseEvent);
      window.addEventListener("mousedown", this.handleKeyboardMouseEvent);
      window.addEventListener("mouseup", this.handleKeyboardMouseEvent);
      window.addEventListener("contextmenu", this.handleKeyboardMouseEvent);
    }
    
    this.pressedButtons.clear();
    this.pollGamepads();
  }
  
  stop() {
    this.recording = false;
    
    if (typeof window !== 'undefined') {
      window.removeEventListener("keydown", this.handleKeyboardMouseEvent);
      window.removeEventListener("keyup", this.handleKeyboardMouseEvent);
      window.removeEventListener("mousedown", this.handleKeyboardMouseEvent);
      window.removeEventListener("mouseup", this.handleKeyboardMouseEvent);
      window.removeEventListener("contextmenu", this.handleKeyboardMouseEvent);
    }
    
    if (this.gamepadAnimationFrameId !== null) {
      cancelAnimationFrame(this.gamepadAnimationFrameId);
      this.gamepadAnimationFrameId = null;
    }
    
    this.activeKeys.clear();
    this.pressedButtons.clear();
    this.firstPressedButton = null;
    this.waitingForRelease = false;
    this.ignoreUntilRelease = false;
    this.pendingSnapshot = undefined;
  }
  
  destroy() {
    this.stop();
  }
  
  private readonly handleKeyboardMouseEvent = (e: KeyboardEvent | MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (e.type === "keydown") {
      const ke = e as KeyboardEvent;
      
      if (this.options.cancellable && ke.code === "Escape") {
        this.stop();
        this.options.onCancel?.();
        return false;
      }
      
      this.activeKeys.add(ke.code);
      
      // Check if all keys/buttons released to clear ignore flag
      if (this.ignoreUntilRelease && this.activeKeys.size === 0 && this.pressedButtons.size === 0) {
        this.ignoreUntilRelease = false;
      }
      
      if (this.ignoreUntilRelease) return false;
      
      if (this.waitingForRelease && !this.options.emitImmediately) return false;
      
      this.shift = ke.shiftKey;
      this.alt = ke.altKey;
      this.ctrl = ke.ctrlKey;
      
      if (this.options.blacklistedKeyboardCodes?.includes(ke.code)) {
        return false;
      }
      
      if (!isModifierKey(ke.key)) {
        this.keyCode = ke.code;
        this.keyName = deriveKeyName(ke.key, ke.code);
        this.storeKeyboardSnapshot();
      }
    } else if (e.type === "keyup") {
      const ke = e as KeyboardEvent;
      this.activeKeys.delete(ke.code);
      
      this.shift = ke.shiftKey;
      this.alt = ke.altKey;
      this.ctrl = ke.ctrlKey;
      
      // Check if all keys/buttons released to clear ignore flag
      if (this.ignoreUntilRelease && this.activeKeys.size === 0 && this.pressedButtons.size === 0) {
        this.ignoreUntilRelease = false;
      }
      
      this.checkForCompleteRelease();
    } else if (e.type === "mousedown") {
      const me = e as MouseEvent;
      
      if (this.options.blacklistedMouseButtons?.includes(me.button)) {
        return false;
      }
      
      this.activeKeys.add(`Mouse${me.button}`);
      
      // Check if all keys/buttons released to clear ignore flag
      if (this.ignoreUntilRelease && this.activeKeys.size === 0 && this.pressedButtons.size === 0) {
        this.ignoreUntilRelease = false;
      }
      
      if (this.ignoreUntilRelease) return false;
      
      if (!this.waitingForRelease || this.options.emitImmediately) {
        this.shift = me.shiftKey;
        this.alt = me.altKey;
        this.ctrl = me.ctrlKey;
        this.mouse = me.button;
        this.storeKeyboardSnapshot();
      }
    } else if (e.type === "mouseup") {
      const me = e as MouseEvent;
      this.activeKeys.delete(`Mouse${me.button}`);
      
      // Check if all keys/buttons released to clear ignore flag
      if (this.ignoreUntilRelease && this.activeKeys.size === 0 && this.pressedButtons.size === 0) {
        this.ignoreUntilRelease = false;
      }
      
      this.checkForCompleteRelease();
    }
    return false;
  };
  
  private readonly pollGamepads = () => {
    const gamepads = navigator.getGamepads();
    
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (!gamepad) continue;
      
      const anyButtonPressed = gamepad.buttons.some(btn => btn.pressed);
      
      if (anyButtonPressed && (!this.detectedGamepad || gamepad.index !== this.detectedGamepad.index)) {
        this.detectedGamepad = gamepad;
        this.pressedButtons.clear();
      }
      
      if (this.detectedGamepad && gamepad.index === this.detectedGamepad.index) {
        const currentPressed: Set<number> = new Set();
        const comboButtons = [4, 5, 6, 7];
        
        gamepad.buttons.forEach((button, index) => {
          if (button.pressed && !this.options.blacklistedGamepadButtons?.includes(index)) {
            currentPressed.add(index);
          }
        });
        
        const newPresses: number[] = [];
        currentPressed.forEach(btn => {
          if (!this.pressedButtons.has(btn)) {
            newPresses.push(btn);
          }
        });
        
        const released: number[] = [];
        this.pressedButtons.forEach(btn => {
          if (!currentPressed.has(btn)) {
            released.push(btn);
          }
        });
        
        if (this.options.cancellable && (newPresses.includes(9) || released.includes(9))) {
          this.stop();
          this.options.onCancel?.();
          this.pressedButtons = currentPressed;
          continue;
        }
        
        // Check if all keys/buttons released to clear ignore flag
        if (this.ignoreUntilRelease && this.activeKeys.size === 0 && currentPressed.size === 0) {
          this.ignoreUntilRelease = false;
          this.pressedButtons = currentPressed;
          continue;
        }
        
        if (this.ignoreUntilRelease) {
          this.pressedButtons = currentPressed;
          continue;
        }
        
        if (this.waitingForRelease && !this.options.emitImmediately) {
          this.pressedButtons = currentPressed;
          if (currentPressed.size === 0) {
            this.checkForCompleteRelease();
          }
          continue;
        }
        
        if (newPresses.length > 0 && this.firstPressedButton === null) {
          this.firstPressedButton = newPresses[0];
        }
        
        if (newPresses.length > 0) {
          const mainButton = newPresses.find(btn => !comboButtons.includes(btn));
          
          if (mainButton !== undefined && comboButtons.includes(this.firstPressedButton!)) {
            this.storeGamepadSnapshot(mainButton, this.firstPressedButton!);
          }
        }
        
        if (released.length > 0 && !this.waitingForRelease) {
          if (released.includes(this.firstPressedButton!) && currentPressed.size === 0) {
            this.storeGamepadSnapshot(this.firstPressedButton!);
          }
        }
        
        if (currentPressed.size === 0) {
          this.firstPressedButton = null;
        }
        
        this.pressedButtons = currentPressed;
      }
    }
    
    if (this.recording) {
      this.gamepadAnimationFrameId = requestAnimationFrame(this.pollGamepads);
    }
  };
  
  private storeKeyboardSnapshot() {
    if (this.waitingForRelease && !this.options.emitImmediately) return;
    
    this.waitingForRelease = true;
    
    const input: KeyboardInput = {};
    if (this.shift) input.shift = this.shift;
    if (this.alt) input.alt = this.alt;
    if (this.ctrl) input.ctrl = this.ctrl;
    if (this.mouse !== undefined) input.mouse = this.mouse;
    if (this.keyCode) input.keyCode = this.keyCode;
    if (this.keyName) input.keyName = this.keyName;
    
    this.pendingSnapshot = input;
    
    if (this.options.emitImmediately) {
      this.options.onInput(input);
      this.ignoreUntilRelease = true;
      this.waitingForRelease = false;
      this.pendingSnapshot = undefined;
    }
  }
  
  private storeGamepadSnapshot(button: number, trigger?: number) {
    if (this.waitingForRelease && !this.options.emitImmediately) return;
    
    this.waitingForRelease = true;
    
    const input: GamepadInput = { button };
    if (trigger !== undefined && trigger !== button) {
      input.trigger = trigger;
    }
    
    this.pendingSnapshot = input;
    
    if (this.options.emitImmediately) {
      this.options.onInput(input);
      this.ignoreUntilRelease = true;
      this.waitingForRelease = false;
      this.pendingSnapshot = undefined;
    }
  }
  
  private checkForCompleteRelease() {
    if (!this.waitingForRelease || !this.pendingSnapshot || this.options.emitImmediately) return;
    
    if (this.activeKeys.size > 0) return;
    if (this.pressedButtons.size > 0) return;
    
    this.options.onInput(this.pendingSnapshot);
    this.stop();
  }
}
