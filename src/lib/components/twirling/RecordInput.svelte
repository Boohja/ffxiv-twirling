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
  let detectedDeviceName: string | null = null;
  
  // Blacklisted buttons (dynamically adjusted based on cancellable prop)
  $: BLACKLISTED_KEYBOARD_CODES = cancellable ? ['Enter', 'F5'] : ['Escape', 'Enter', 'F5'];
  $: BLACKLISTED_GAMEPAD_BUTTONS = cancellable ? [8] : [8, 9]; // Select always blacklisted, Start only when not cancellable
  
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
    
    if (e.type === "keydown" || e.type === "keyup") {
      const ke = e as KeyboardEvent;
      
      // Handle cancellation with Escape
      if (cancellable && ke.code === "Escape") {
        stopRecording();
        dispatch("cancel");
        return false;
      }
      
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
        makeKeyboardSnapshot();
      }
    } else if (e.type === "mouseup") {
      const me = e as MouseEvent;
      mouse = me.button;
      detectedDeviceName = "Keyboard & Mouse";
      makeKeyboardSnapshot();
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
        
        // Track the first button pressed
        if (newPresses.length > 0 && firstPressedButton === null) {
          firstPressedButton = newPresses[0];
        }
        
        if (newPresses.length > 0) {
          const mainButton = newPresses.find(btn => !comboButtons.includes(btn));
          
          // Valid combo: first button must be a combo button
          if (mainButton !== undefined && comboButtons.includes(firstPressedButton!)) {
            detectedDeviceName = gamepad.id;
            makeGamepadSnapshot(mainButton, firstPressedButton!);
          }
        }
        
        // Check for button releases
        if (released.length > 0 && !hasSnapshot) {
          // If releasing the first pressed button and no combo was formed
          if (released.includes(firstPressedButton!) && currentPressed.size === 0) {
            detectedDeviceName = gamepad.id;
            makeGamepadSnapshot(firstPressedButton!);
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

  function makeKeyboardSnapshot() {
    hasSnapshot = true;
    
    const input: KeyboardInput = {};
    if (shift) input.shift = shift;
    if (alt) input.alt = alt;
    if (ctrl) input.ctrl = ctrl;
    if (mouse !== undefined) input.mouse = mouse;
    if (keyCode) input.keyCode = keyCode;
    if (keyName) input.keyName = keyName;
    
    snapshot = input;
    dispatch("input", input);
    stopRecording();
  }

  function makeGamepadSnapshot(button: number, trigger?: number) {
    hasSnapshot = true;
    
    const input: GamepadInput = { button };
    if (trigger !== undefined && trigger !== button) {
      input.trigger = trigger;
    }
    
    snapshot = input;
    dispatch("input", input);
    stopRecording();
  }

  function startRecording() {
    recording = true;
    snapshot = undefined;
    hasSnapshot = false;

    // Listen for keyboard and mouse events
    if (typeof window !== 'undefined') {
      window.addEventListener("keydown", handleKeyboardMouseEvent);
      window.addEventListener("keyup", handleKeyboardMouseEvent);
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
    
    // Reset gamepad state
    pressedButtons.clear();
    firstPressedButton = null;
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
