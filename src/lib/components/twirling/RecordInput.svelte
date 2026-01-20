<script lang="ts">
  import type { KeyboardInput, GamepadInput } from "$lib/stores";
  import { deriveKeyName, isModifierKey } from "$lib/helpers";
  import { createEventDispatcher, onDestroy } from "svelte";
  import InputRender from "./InputRender.svelte";

  const dispatch = createEventDispatcher<{
    input: KeyboardInput | GamepadInput
    cancel: void
  }>();

  export let showDevice = false;
  export let cancellable = false;

  let recording = false;
  let hasSnapshot = false;
  let waitingForRelease = false;
  let detectedDeviceName: string | null = null;
  
  // Blacklisted buttons (dynamically adjusted based on cancellable prop)
  $: BLACKLISTED_KEYBOARD_CODES = cancellable ? ['Enter', 'F5'] : ['Escape', 'Enter', 'F5'];
  $: BLACKLISTED_GAMEPAD_BUTTONS = cancellable ? [8] : [8, 9]; // Select always blacklisted, Start only when not cancellable
  $: BLACKLISTED_MOUSE_BUTTONS = [0]; // Left click (mouse button 0) is blacklisted
  
  // Keyboard/mouse state
  let shift = false;
  let alt = false;
  let ctrl = false;
  let mouse: number | undefined = undefined;
  let keyCode = "";
  let keyName = "";
  
  // Gamepad state
  let detectedGamepad: Gamepad | null = null;
  let pressedButtons: Set<number> = new Set();
  let firstPressedButton: number | null = null;
  let gamepadAnimationFrameId: number | null = null;
  
  let snapshot: KeyboardInput | GamepadInput | undefined = undefined;
  let pendingSnapshot: KeyboardInput | GamepadInput | undefined = undefined;
  
  // Track active keys for release detection
  let activeKeys: Set<string> = new Set();

  // Export function to start recording externally
  export function start() {
    startRecording();
  }

  onDestroy(() => {
    stopRecording();
  });

  function handleKeyboardMouseEvent(e: KeyboardEvent | MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    
    if (e.type === "keydown") {
      const ke = e as KeyboardEvent;
      
      // Handle cancellation with Escape
      if (cancellable && ke.code === "Escape") {
        stopRecording();
        dispatch("cancel");
        return false;
      }
      
      activeKeys.add(ke.code);
      
      // Don't process if already waiting for release
      if (waitingForRelease) return false;
      
      shift = ke.shiftKey;
      alt = ke.altKey;
      ctrl = ke.ctrlKey;
      
      // Ignore blacklisted keys
      if (BLACKLISTED_KEYBOARD_CODES.includes(ke.code)) {
        return false;
      }
      
      if (!isModifierKey(ke.key)) {
        keyCode = ke.code;
        keyName = deriveKeyName(ke.key, ke.code);
        detectedDeviceName = "Keyboard & Mouse";
        storeKeyboardSnapshot();
      }
    } else if (e.type === "keyup") {
      const ke = e as KeyboardEvent;
      activeKeys.delete(ke.code);
      
      shift = ke.shiftKey;
      alt = ke.altKey;
      ctrl = ke.ctrlKey;
      
      checkForCompleteRelease();
    } else if (e.type === "mousedown") {
      const me = e as MouseEvent;
      
      // Ignore blacklisted mouse buttons
      if (BLACKLISTED_MOUSE_BUTTONS.includes(me.button)) {
        return false;
      }
      
      activeKeys.add(`Mouse${me.button}`);
      
      if (!waitingForRelease) {
        mouse = me.button;
        detectedDeviceName = "Keyboard & Mouse";
        storeKeyboardSnapshot();
      }
    } else if (e.type === "mouseup") {
      const me = e as MouseEvent;
      activeKeys.delete(`Mouse${me.button}`);
      checkForCompleteRelease();
    }
    return false;
  }
  
  function pollGamepads() {
    const gamepads = navigator.getGamepads();
    
    // Check for button presses across all gamepads
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (!gamepad) continue;
      
      const anyButtonPressed = gamepad.buttons.some(btn => btn.pressed);
      
      // Detect or switch to a gamepad when any button is pressed
      if (anyButtonPressed && (!detectedGamepad || gamepad.index !== detectedGamepad.index)) {
        detectedGamepad = gamepad;
        pressedButtons.clear(); // Reset when switching gamepads
      }
      
      // If this is our detected gamepad, track current input
      if (detectedGamepad && gamepad.index === detectedGamepad.index) {
        const currentPressed: Set<number> = new Set();
        const comboButtons = [4, 5, 6, 7]; // L1, R1, L2, R2
        
        gamepad.buttons.forEach((button, index) => {
          if (button.pressed && !BLACKLISTED_GAMEPAD_BUTTONS.includes(index)) {
            currentPressed.add(index);
          }
        });
        
        const newPresses: number[] = [];
        currentPressed.forEach(btn => {
          if (!pressedButtons.has(btn)) {
            newPresses.push(btn);
          }
        });
        
        const released: number[] = [];
        pressedButtons.forEach(btn => {
          if (!currentPressed.has(btn)) {
            released.push(btn);
          }
        });
        
        // Handle Start button for cancellation
        if (cancellable && (newPresses.includes(9) || released.includes(9))) {
          stopRecording();
          dispatch("cancel");
          pressedButtons = currentPressed;
          continue;
        }
        
        // Don't process new presses if waiting for release
        if (waitingForRelease) {
          pressedButtons = currentPressed;
          // Check if all buttons released
          if (currentPressed.size === 0) {
            checkForCompleteRelease();
          }
          continue;
        }
        
        // Track the first button pressed
        if (newPresses.length > 0 && firstPressedButton === null) {
          firstPressedButton = newPresses[0];
        }
        
        if (newPresses.length > 0) {
          const mainButton = newPresses.find(btn => !comboButtons.includes(btn));
          
          // Valid combo: first button must be a combo button
          if (mainButton !== undefined && comboButtons.includes(firstPressedButton!)) {
            detectedDeviceName = gamepad.id;
            storeGamepadSnapshot(mainButton, firstPressedButton!);
          }
        }
        
        // Check for button releases
        if (released.length > 0 && !waitingForRelease) {
          // If releasing the first pressed button and no combo was formed
          if (released.includes(firstPressedButton!) && currentPressed.size === 0) {
            detectedDeviceName = gamepad.id;
            storeGamepadSnapshot(firstPressedButton!);
          }
        }
        
        // Reset first pressed button when all buttons are released
        if (currentPressed.size === 0) {
          firstPressedButton = null;
        }
        
        pressedButtons = currentPressed;
      }
    }
    
    if (recording) {
      gamepadAnimationFrameId = requestAnimationFrame(pollGamepads);
    }
  }

  function storeKeyboardSnapshot() {
    if (waitingForRelease) return;
    
    waitingForRelease = true;
    
    const input: KeyboardInput = {};
    if (shift) input.shift = shift;
    if (alt) input.alt = alt;
    if (ctrl) input.ctrl = ctrl;
    if (mouse !== undefined) input.mouse = mouse;
    if (keyCode) input.keyCode = keyCode;
    if (keyName) input.keyName = keyName;
    
    pendingSnapshot = input;
    snapshot = input;
  }

  function storeGamepadSnapshot(button: number, trigger?: number) {
    if (waitingForRelease) return;
    
    waitingForRelease = true;
    
    const input: GamepadInput = { button };
    if (trigger !== undefined && trigger !== button) {
      input.trigger = trigger;
    }
    
    pendingSnapshot = input;
    snapshot = input;
  }
  
  function checkForCompleteRelease() {
    if (!waitingForRelease || !pendingSnapshot) return;
    
    // Check if all keyboard/mouse inputs are released
    if (activeKeys.size > 0) return;
    
    // Check if all gamepad buttons are released
    if (pressedButtons.size > 0) return;
    
    // Everything is released, emit the pending snapshot
    hasSnapshot = true;
    dispatch("input", pendingSnapshot);
    stopRecording();
  }

  function startRecording() {
    recording = true;
    snapshot = undefined;
    pendingSnapshot = undefined;
    hasSnapshot = false;
    waitingForRelease = false;
    activeKeys.clear();

    // Listen for keyboard and mouse events
    if (typeof window !== 'undefined') {
      window.addEventListener("keydown", handleKeyboardMouseEvent);
      window.addEventListener("keyup", handleKeyboardMouseEvent);
      window.addEventListener("mousedown", handleKeyboardMouseEvent);
      window.addEventListener("mouseup", handleKeyboardMouseEvent);
      window.addEventListener("contextmenu", handleKeyboardMouseEvent);
    }
    
    // Start gamepad polling
    pressedButtons.clear();
    pollGamepads();
  }

  function stopRecording() {
    recording = false;
    
    // Remove all event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener("keydown", handleKeyboardMouseEvent);
      window.removeEventListener("keyup", handleKeyboardMouseEvent);
      window.removeEventListener("mousedown", handleKeyboardMouseEvent);
      window.removeEventListener("mouseup", handleKeyboardMouseEvent);
      window.removeEventListener("contextmenu", handleKeyboardMouseEvent);
    }

    if (gamepadAnimationFrameId !== null) {
      cancelAnimationFrame(gamepadAnimationFrameId);
      gamepadAnimationFrameId = null;
    }
    
    // Reset keyboard/mouse state (but keep snapshot visible)
    shift = false;
    alt = false;
    ctrl = false;
    mouse = undefined;
    keyCode = "";
    keyName = "";
    activeKeys.clear();
    
    // Reset gamepad state
    pressedButtons.clear();
    firstPressedButton = null;
    waitingForRelease = false;
    pendingSnapshot = undefined;
    // Note: hasSnapshot and snapshot are NOT cleared here - keep them visible
  }
</script>

<!-- Live status panel -->
<div class="rounded-lg border border-slate-700 bg-slate-800 p-4 min-h-[8rem] flex items-center justify-center">
  {#if !recording && !hasSnapshot}
    <div class="text-center text-slate-400">Not recording</div>
  {:else if !recording && hasSnapshot && snapshot}
    <div class="flex items-center justify-center">
      <InputRender 
        input={snapshot} 
        mode="pretty" 
        showPlus={true} 
      />
    </div>
  {:else if !hasSnapshot && !ctrl && !shift && !alt && !keyName && mouse === undefined && pressedButtons.size === 0}
    <div class="flex items-center justify-center gap-3 text-slate-300">
      <span class="relative flex h-4 w-4">
        <span class="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-70 animate-ping"></span>
        <span class="relative inline-flex h-4 w-4 rounded-full bg-teal-500"></span>
      </span>
      <span class="font-medium">Press any input</span>
    </div>
  {:else if (ctrl || shift || alt || keyName || mouse !== undefined) && !hasSnapshot}
    <div class="flex items-center justify-center">
      <InputRender 
        input={{
          ...(shift && { shift }), 
          ...(alt && { alt }), 
          ...(ctrl && { ctrl }), 
          ...(mouse !== undefined && { mouse }), 
          keyCode, 
          keyName
        }} 
        mode="pretty" 
        showPlus={true} 
      />
    </div>
  {:else if pressedButtons.size > 0 && !hasSnapshot}
    <div class="flex items-center justify-center">
      <InputRender 
        input={{button: Array.from(pressedButtons)[0]}} 
        mode="pretty" 
        showPlus={true} 
      />
    </div>
  {:else if hasSnapshot && snapshot}
    <div class="flex items-center justify-center">
      <InputRender 
        input={snapshot} 
        mode="pretty" 
        showPlus={true} 
      />
    </div>
  {/if}
</div>

{#if showDevice}
  <div class="mt-2 text-start text-xs text-slate-500">
    Device: {detectedDeviceName}
  </div>
{/if}
