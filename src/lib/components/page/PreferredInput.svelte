<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import { Icon } from "svelte-icons-pack";
  import { BiCheck, BiX, BiJoystick } from "svelte-icons-pack/bi";
  import { getGamepadButtonUrl } from "$lib/iconLoader";

  export let input: 'keyboard' | 'gamepad' = 'keyboard';
  export let gamepadLayout: 'ps' | 'xbox' | undefined = undefined;

  const dispatch = createEventDispatcher();
  
  let currentSelection = input;
  let showGamepadModal = false;
  let detectingGamepad = false;
  let detectedGamepad: Gamepad | null = null;
  let detectedLayout: 'ps' | 'xbox' | undefined = undefined;
  let gamepadPollInterval: number | null = null;
  let previousButtonStates: Map<number, boolean[]> = new Map();
  
  $: currentSelection = input;

  function handleInputChange(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    
    const target = e.target as HTMLSelectElement;
    const value = target.value as 'keyboard' | 'gamepad';
    
    if (value === 'gamepad') {
      showGamepadModal = true;
      startGamepadDetection();
    } else {
      input = 'keyboard';
      gamepadLayout = undefined;
      currentSelection = 'keyboard';
      dispatch('change', { input: 'keyboard', gamepadLayout: undefined });
    }
  }

  function startGamepadDetection() {
    detectingGamepad = true;
    detectedGamepad = null;
    detectedLayout = undefined;
    previousButtonStates.clear();
    
    if (typeof window !== 'undefined') {
      gamepadPollInterval = window.setInterval(pollForGamepad, 100);
    }
  }

  function stopGamepadDetection() {
    detectingGamepad = false;
    if (gamepadPollInterval !== null) {
      clearInterval(gamepadPollInterval);
      gamepadPollInterval = null;
    }
    previousButtonStates.clear();
  }

  function pollForGamepad() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (!gamepad) continue;
      
      const currentButtons = gamepad.buttons.map(btn => btn.pressed);
      const previousButtons = previousButtonStates.get(i) || [];
      
      // Detect new button press (transition from unpressed to pressed)
      const hasNewPress = currentButtons.some((pressed, btnIdx) => 
        pressed && !previousButtons[btnIdx]
      );
      
      previousButtonStates.set(i, currentButtons);
      
      if (hasNewPress) {
        detectGamepad(gamepad);
        break;
      }
    }
  }

  function detectGamepad(gamepad: Gamepad) {
    if (detectedGamepad) return;
    
    stopGamepadDetection();
    detectedGamepad = gamepad;
    
    const id = gamepad.id.toLowerCase();
    
    // Detect controller brand
    if (id.includes('xbox') || id.includes('xinput') || id.includes('microsoft')) {
      detectedLayout = 'xbox';
    } 
    else if (
      (id.includes('vendor: 054c') && (id.includes('product: 0ce6') || id.includes('product: 09cc'))) ||
      id.includes('playstation') || 
      id.includes('dualshock') || 
      id.includes('dualsense') || 
      id.includes('sony')
    ) {
      detectedLayout = 'ps';
    }
  }

  function selectLayout(layout: 'ps' | 'xbox') {
    input = 'gamepad';
    gamepadLayout = layout;
    currentSelection = 'gamepad';
    showGamepadModal = false;
    dispatch('change', { input: 'gamepad', gamepadLayout: layout });
  }

  function cancelGamepadSelection() {
    stopGamepadDetection();
    showGamepadModal = false;
    detectedGamepad = null;
    detectedLayout = undefined;
    
    input = 'keyboard';
    gamepadLayout = undefined;
    currentSelection = 'keyboard';
    
    dispatch('change', { input: 'keyboard', gamepadLayout: undefined });
  }

  onDestroy(() => {
    stopGamepadDetection();
  });
</script>

<div class="flex items-center gap-3">
  <label for="input-device" class="text-sm text-slate-300">Your preferred input device:</label>
  <select
    id="input-device"
    class="rounded border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
    bind:value={currentSelection}
    on:change={handleInputChange}
    on:click|stopPropagation
  >
    <option value="keyboard">Mouse & Keyboard</option>
    <option value="gamepad">Gamepad</option>
  </select>
  
  {#if input === 'gamepad' && gamepadLayout}
    <span class="text-xs text-slate-400">
      ({gamepadLayout === 'ps' ? 'PlayStation' : 'Xbox'} layout)
    </span>
  {/if}
</div>

<!-- Gamepad Detection Modal -->
{#if showGamepadModal}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="gamepad-detection-title"
  >
    <div class="w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
      <!-- Header -->
      <div class="flex items-center gap-3 border-b border-slate-700 bg-slate-800/60 px-6 py-4">
        <Icon src={BiJoystick} size="1.3em" className="text-teal-400" />
        <h2 id="gamepad-detection-title" class="text-lg font-semibold text-slate-100">Gamepad Detection</h2>
      </div>

      <!-- Body -->
      <div class="px-6 py-6">
        {#if detectingGamepad}
          <div class="text-center">
            <div class="mb-4 flex justify-center">
              <span class="relative flex h-12 w-12">
                <span class="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-70 animate-ping"></span>
                <span class="relative inline-flex h-12 w-12 rounded-full bg-teal-500"></span>
              </span>
            </div>
            <p class="text-slate-300 mb-2">Waiting for gamepad input...</p>
            <p class="text-sm text-slate-400">Press any button on your controller</p>
          </div>
        {:else if detectedGamepad}
          <div class="space-y-4">
            <div class="rounded-lg border border-teal-700/50 bg-teal-900/20 p-4">
              <div class="flex items-center gap-2 text-teal-300 mb-2">
                <Icon src={BiCheck} size="1.2em" />
                <span class="font-semibold">Controller detected!</span>
              </div>
              <p class="text-sm text-slate-300">{detectedGamepad.id}</p>
            </div>

            <div>
              <p class="block text-sm text-slate-300 mb-3">Select your button layout:</p>
              <div class="grid grid-cols-2 gap-3 items-start">
                <!-- PlayStation Layout -->
                <button
                  class="group relative overflow-hidden rounded-lg border-2 transition-all hover:border-teal-500 hover:shadow-lg hover:shadow-teal-500/20 border-slate-600 bg-slate-800"
                  on:click={() => selectLayout('ps')}
                >
                  <div class="p-3">
                    <p class="text-xs font-semibold text-slate-200 mb-2">PlayStation</p>
                    <div class="grid grid-cols-4 gap-1.5">
                      <img src={getGamepadButtonUrl('ps', 0)} alt="Cross" class="w-full h-auto rounded" />
                      <img src={getGamepadButtonUrl('ps', 1)} alt="Circle" class="w-full h-auto rounded" />
                      <img src={getGamepadButtonUrl('ps', 2)} alt="Square" class="w-full h-auto rounded" />
                      <img src={getGamepadButtonUrl('ps', 3)} alt="Triangle" class="w-full h-auto rounded" />
                    </div>
                    {#if detectedLayout === 'ps'}
                      <p class="text-xs text-teal-300 mt-2">Auto-detected</p>
                    {/if}
                  </div>
                </button>

                <!-- Xbox Layout -->
                <button
                  class="group relative overflow-hidden rounded-lg border-2 transition-all hover:border-teal-500 hover:shadow-lg hover:shadow-teal-500/20 border-slate-600 bg-slate-800"
                  on:click={() => selectLayout('xbox')}
                >
                  <div class="p-3">
                    <p class="text-xs font-semibold text-slate-200 mb-2">Xbox</p>
                    <div class="grid grid-cols-4 gap-1.5">
                      <img src={getGamepadButtonUrl('xbox', 0)} alt="A" class="w-full h-auto rounded" />
                      <img src={getGamepadButtonUrl('xbox', 1)} alt="B" class="w-full h-auto rounded" />
                      <img src={getGamepadButtonUrl('xbox', 2)} alt="X" class="w-full h-auto rounded" />
                      <img src={getGamepadButtonUrl('xbox', 3)} alt="Y" class="w-full h-auto rounded" />
                    </div>
                    {#if detectedLayout === 'xbox'}
                      <p class="text-xs text-teal-300 mt-2">Auto-detected</p>
                    {/if}
                  </div>
                </button>
              </div>
            </div>
          </div>
        {/if}

        <!-- Actions -->
        <div class="mt-6">
          <button
            class="w-full inline-flex items-center justify-center gap-2 rounded-full border border-slate-600 bg-transparent px-5 py-3 text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/50"
            on:click={cancelGamepadSelection}
          >
            <Icon src={BiX} />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
