<script lang="ts">
  import type { KeyboardInput, GamepadInput } from "$lib/stores";
  import { InputSnapshot } from "$lib/inputParser";
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
  let hasValidSnapshot = false;
  
  let snapshot: KeyboardInput | GamepadInput | undefined = undefined;
  let pendingSnapshot: KeyboardInput | GamepadInput | undefined = undefined;
  let livePreview: KeyboardInput | GamepadInput | undefined = undefined;
  
  // Input detection engine
  const inputSnapshot = new InputSnapshot();
  let gamepadAnimationFrameId: number | null = null;

  export function start() {
    startRecording();
  }

  export function stop() {
    stopRecording();
  }

  onDestroy(() => {
    stopRecording();
  });

  inputSnapshot.onProcessed((input) => {
    if (!recording || hasValidSnapshot) return;

    const hasKeyboardInput = input.keyCode || input.mouse !== undefined || 
                             (input.ctrl || input.shift || input.alt);
    const hasGamepadInput = input.button !== undefined || input.trigger !== undefined;
    
    if (hasKeyboardInput || hasGamepadInput) {
      livePreview = input;
      
      if (hasKeyboardInput) {
        detectedDeviceName = "Keyboard & Mouse";
      }
    }
  });

  inputSnapshot.onValidSnapshot((input) => {
    if (!recording) return;

    hasValidSnapshot = true;
    pendingSnapshot = input;
    snapshot = input;
    livePreview = input;
    
    // Detect device name
    if (input.keyCode || input.keyName || input.mouse !== undefined) {
      detectedDeviceName = "Keyboard & Mouse";
    }
  });

  inputSnapshot.onRelease(() => {
    if (!recording || !pendingSnapshot) return;

    hasSnapshot = true;
    dispatch("input", pendingSnapshot);
    stopRecording();
  });

  inputSnapshot.onCancelInput(() => {
    if (!recording) return;

    if (cancellable) {
      stopRecording();
      dispatch("cancel");
    }
  });

  function pollGamepads() {
    const gamepads = navigator.getGamepads();
    
    // Get first gamepad with pressed buttons for device name
    const activeGamepad = gamepads.find(gp => gp?.buttons.some(btn => btn.pressed));
    if (activeGamepad) {
      detectedDeviceName = activeGamepad.id;
    }
    
    inputSnapshot.processGamepads(gamepads);
    
    if (recording) {
      gamepadAnimationFrameId = requestAnimationFrame(pollGamepads);
    }
  }

  function startRecording() {
    recording = true;
    snapshot = undefined;
    pendingSnapshot = undefined;
    livePreview = undefined;
    hasSnapshot = false;
    hasValidSnapshot = false;
    inputSnapshot.reset();

    if (typeof window !== 'undefined') {
      window.addEventListener("keydown", inputSnapshot.processKeyboardEvent);
      window.addEventListener("keyup", inputSnapshot.processKeyboardEvent);
      window.addEventListener("mousedown", inputSnapshot.processMouseEvent);
      window.addEventListener("mouseup", inputSnapshot.processMouseEvent);
      window.addEventListener("pointerdown", inputSnapshot.processMouseEvent);
      window.addEventListener("contextmenu", inputSnapshot.processMouseEvent);
    }

    pollGamepads();
  }

  function stopRecording() {
    recording = false;

    if (typeof window !== 'undefined') {
      window.removeEventListener("keydown", inputSnapshot.processKeyboardEvent);
      window.removeEventListener("keyup", inputSnapshot.processKeyboardEvent);
      window.removeEventListener("mousedown", inputSnapshot.processMouseEvent);
      window.removeEventListener("mouseup", inputSnapshot.processMouseEvent);
      window.removeEventListener("contextmenu", inputSnapshot.processMouseEvent);
    }

    if (gamepadAnimationFrameId !== null) {
      cancelAnimationFrame(gamepadAnimationFrameId);
      gamepadAnimationFrameId = null;
    }
    
    pendingSnapshot = undefined;
  }
</script>

<div class="rounded-lg border {recording ? 'border-primary-glow' : 'border-slate-700'} bg-slate-800 p-4 min-h-[8rem] flex items-center justify-center">
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
  {:else if recording && livePreview}
    <div class="flex items-center justify-center">
      <InputRender 
        input={livePreview} 
        mode="pretty" 
        showPlus={true} 
      />
    </div>
  {:else if recording}
    <div class="flex items-center justify-center gap-3 text-slate-300">
      <span class="relative flex h-6 w-6">
        <span class="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-70 animate-ping"></span>
        <span class="relative inline-flex h-6 w-6 rounded-full bg-teal-500"></span>
      </span>
      <span class="font-medium">Press any input</span>
    </div>
  {/if}
</div>

{#if showDevice}
  <div class="mt-2 text-start text-xs text-slate-500">
    Device: {detectedDeviceName}
  </div>
{/if}
