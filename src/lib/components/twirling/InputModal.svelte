<script lang="ts">
  import type { RotationStep, KeyboardInput, GamepadInput } from "$lib/stores";
  import { deriveKeyName, formatKeybind, formatGamepadInput, isModifierKey } from "$lib/helpers";
  import { createEventDispatcher, onDestroy } from "svelte";
  import { Icon } from "svelte-icons-pack";
  import { BiMouse, BiMicrophone, BiCheckCircle, BiXCircle, BiErrorCircle, BiJoystick } from "svelte-icons-pack/bi";

  const dispatch = createEventDispatcher();
  let opened = false;
  let recording = false;
  let hasSnapshot = false;
  
  let shift = false;
  let alt = false;
  let ctrl = false;
  let mouse: number | undefined = undefined;
  let keyCode = "";
  let keyName = "";
  
  let gamepadConnected = false;
  let gamepadIndex: number | null = null;
  let gamepadName = "";
  let pressedButtons: Set<number> = new Set();
  let gamepadPollInterval: number | null = null;
  
  let snapshot: KeyboardInput | GamepadInput | undefined = undefined;

  export function show() {
    opened = true;
    checkGamepadConnection();
    if (typeof window !== 'undefined') {
      window.addEventListener("gamepadconnected", handleGamepadConnected);
    }
    startRecording();
  }
  
  function close() {
    stopRecording();
    hasSnapshot = false;
    snapshot = undefined;
    if (typeof window !== 'undefined') {
      window.removeEventListener("gamepadconnected", handleGamepadConnected);
    }
    opened = false;
  }
  
  function handleGamepadConnected(e: GamepadEvent) {
    gamepadConnected = true;
    gamepadIndex = e.gamepad.index;
    gamepadName = e.gamepad.id;
  }
  
  function checkGamepadConnection() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) {
      gamepadConnected = false;
      return;
    }
    
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        gamepadConnected = true;
        gamepadIndex = i;
        gamepadName = gamepads[i]!.id;
        break;
      }
    }
  }
  
  function handleEvent(e: KeyboardEvent | MouseEvent) {
    
    e.stopPropagation();
    e.preventDefault();
    if (e.type === "keydown" || e.type === "keyup") {
      const ke = e as KeyboardEvent;
      shift = ke.shiftKey;
      alt = ke.altKey;
      ctrl = ke.ctrlKey;
      if (ke.code === "Escape") {
        stopRecording();
      } else if (!isModifierKey(ke.key)) {
        keyCode = ke.code;
        keyName = deriveKeyName(ke.key, ke.code);
        makeSnapshot();
        stopRecording();
      }
    } else if (e.type === "mouseup") {
      const me = e as MouseEvent;
      mouse = me.button;
      makeSnapshot();
      stopRecording();
    }
    return false;
  }
  
  function pollGamepad() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads || gamepadIndex === null) return;
    
    const gamepad = navigator.getGamepads()[gamepadIndex];
    if (!gamepad) {
      gamepadConnected = false;
      stopRecording();
      return;
    }
    
    const currentPressed: Set<number> = new Set();
    const triggerButtons = [4, 5, 6, 7]; // L1, R1, L2, R2 (all can be standalone or triggers)
    let activeTrigger: number | undefined;
    
    gamepad.buttons.forEach((button, index) => {
      if (button.pressed) {
        currentPressed.add(index);
        if (triggerButtons.includes(index)) {
          activeTrigger = index;
        }
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
    
    // If we have new presses, handle them
    if (newPresses.length > 0) {
      // Find non-trigger buttons (face buttons, d-pad)
      const mainButton = newPresses.find(btn => !triggerButtons.includes(btn));
      
      if (mainButton !== undefined) {
        // We have a main button press, check if there's an active trigger
        snapshot = {
          button: mainButton,
          ...(activeTrigger !== undefined && { trigger: activeTrigger })
        };
        hasSnapshot = true;
        stopRecording();
      }
      // If only trigger buttons were pressed, wait for either a main button or release
    }
    
    // Check for trigger button releases without combination
    if (released.length > 0 && !hasSnapshot) {
      for (const btn of released) {
        if (triggerButtons.includes(btn)) {
          // Trigger button was released without pressing another button
          snapshot = { button: btn };
          hasSnapshot = true;
          stopRecording();
          break;
        }
      }
    }
    
    pressedButtons = currentPressed;
  }

  function makeSnapshot() {
    hasSnapshot = true;
    snapshot = {
      ...(shift && { shift }),
      ...(alt && { alt }),
      ...(ctrl && { ctrl }),
      ...(mouse !== undefined && { mouse }),
      keyCode,
      keyName,
    };
  }

  function startRecording() {
    recording = true;
    snapshot = undefined;
    hasSnapshot = false;

    // Listen for both keyboard and gamepad events (mutually exclusive)
    window.addEventListener("keydown", handleEvent);
    window.addEventListener("keyup", handleEvent);
    window.addEventListener("mouseup", handleEvent);
    window.addEventListener("contextmenu", handleEvent);
    
    pressedButtons.clear();
    gamepadPollInterval = window.setInterval(pollGamepad, 50); // Poll at 20Hz
  }

  function stopRecording() {
    recording = false;
    
    // Remove all event listeners
    window.removeEventListener("keydown", handleEvent);
    window.removeEventListener("keyup", handleEvent);
    window.removeEventListener("mouseup", handleEvent);
    window.removeEventListener("contextmenu", handleEvent);

    if (gamepadPollInterval !== null) {
      clearInterval(gamepadPollInterval);
      gamepadPollInterval = null;
    }
    
    // Reset state
    shift = false;
    alt = false;
    ctrl = false;
    mouse = undefined;
    keyCode = "";
    keyName = "";
    pressedButtons.clear();
  }
  
  onDestroy(() => {
    if (gamepadPollInterval !== null) {
      clearInterval(gamepadPollInterval);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener("gamepadconnected", handleGamepadConnected);
    }
  });

  function submit() {
    if (!hasSnapshot || recording) return;
    dispatch("keybind", snapshot);
    close();
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 {opened ? '' : 'hidden'}"
  role="dialog"
  aria-modal="true"
  aria-labelledby="keybind-title"
>
  <div class="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
    <!-- Header -->
    <div class="flex items-center gap-3 border-b border-slate-700 bg-slate-800/60 px-6 py-4">
      <Icon src={BiMouse} size="1.3em" className="text-teal-400" />
      <h2 id="keybind-title" class="text-lg font-semibold text-slate-100">Record a keybind</h2>
      <div class="ml-auto text-xs text-slate-400 flex items-center gap-1">
        <Icon src={BiErrorCircle} size="1em" />
        <span>Press ESC to cancel recording</span>
      </div>
    </div>

    <!-- Body -->
    <div class="px-6 py-6">
      {#if gamepadConnected && gamepadName}
        <div class="mb-3 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-300">
          <div class="flex items-center gap-2">
            <Icon src={BiJoystick} size="1em" className="text-teal-400" />
            <span>Gamepad connected: {gamepadName}</span>
          </div>
        </div>
      {/if}
      
      <p class="text-sm text-slate-300 mb-3">
        Press keyboard keys, click a mouse button, or press gamepad buttons.
      </p>

      <!-- Live status panel -->
      <div class="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-4 text-center">
        {#if !recording && !hasSnapshot}
          <div class="text-slate-400">Nothing yet.</div>
        {:else if recording && !ctrl && !shift && !alt && !keyName && mouse === undefined && pressedButtons.size === 0}
          <div class="flex items-center justify-center gap-3 text-slate-300">
            <span class="relative flex h-4 w-4">
              <span class="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-70 animate-ping"></span>
              <span class="relative inline-flex h-4 w-4 rounded-full bg-teal-500"></span>
            </span>
            <span class="font-medium">Recording… press any input</span>
          </div>
        {:else if !recording && hasSnapshot}
          <div class="text-teal-300 font-semibold">{formatKeybind(snapshot)}</div>
        {/if}

        <!-- Visual chips -->
        <div class="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm">
          {#if ctrl}<kbd class="rounded bg-slate-700 px-2 py-1 text-slate-200">Ctrl</kbd>{/if}
          {#if shift}<kbd class="rounded bg-slate-700 px-2 py-1 text-slate-200">Shift</kbd>{/if}
          {#if alt}<kbd class="rounded bg-slate-700 px-2 py-1 text-slate-200">Alt</kbd>{/if}
          {#if keyName}<kbd class="rounded bg-slate-700 px-2 py-1 text-slate-200">{keyName}</kbd>{/if}
          {#if mouse !== undefined}
            <span class="inline-flex items-center gap-1 rounded bg-slate-700 px-2 py-1 text-slate-200">Mouse{mouse + 1}</span>
          {/if}
          {#if recording && pressedButtons.size > 0}
            {#each Array.from(pressedButtons) as btn}
              <kbd class="rounded bg-slate-700 px-2 py-1 text-slate-200">
                {formatGamepadInput({button: btn})}
              </kbd>
            {/each}
          {/if}
        </div>
      </div>

      <!-- Actions -->
      <div class="grid grid-cols-3 gap-3">
        <button
          class="inline-flex items-center justify-center gap-2 rounded-full border border-slate-600 bg-slate-800 px-5 py-3 text-slate-100 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          on:click={startRecording}
        >
          <Icon src={BiMicrophone} />
          <span class="whitespace-nowrap">{recording ? 'Recording… (ESC)' : 'Start recording'}</span>
        </button>

        <button
          class="inline-flex items-center justify-center gap-2 rounded-full border border-teal-700 bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 {hasSnapshot ? '' : 'opacity-40 cursor-not-allowed'}"
          on:click={submit}
        >
          <Icon src={BiCheckCircle} />
          <span>Use this</span>
        </button>

        <button
          class="inline-flex items-center justify-center gap-2 rounded-full border border-slate-600 bg-transparent px-5 py-3 text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/50"
          on:click={close}
        >
          <Icon src={BiXCircle} />
          <span>Cancel</span>
        </button>
      </div>
    </div>
  </div>
</div>
