<script lang="ts">
  import type { KeyboardInput, GamepadInput } from "$lib/stores";
  import { formatKeybind } from "$lib/helpers";
  import { getGamepadButtonUrl } from "$lib/iconLoader";
  import { onMount } from "svelte";
	import Keycap from "../Keycap.svelte";
	import MouseButton from "../MouseButton.svelte";

  export let input: KeyboardInput | GamepadInput | undefined = undefined;
  export let mode: 'text' | 'pretty' = 'pretty';
  export let showPlus: boolean = false;

  let gamepadLayout: 'ps' | 'xbox' = 'ps';
  let mounted = false;

  onMount(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('gamepadLayout');
      if (saved === 'ps' || saved === 'xbox') {
        gamepadLayout = saved;
      }
    }
    mounted = true;
  });

  function isGamepadInput(input: KeyboardInput | GamepadInput | undefined): input is GamepadInput {
    return input !== undefined && 'button' in input;
  }

  function isKeyboardInput(input: KeyboardInput | GamepadInput | undefined): input is KeyboardInput {
    return input !== undefined && !('button' in input);
  }
</script>

{#if !input}
  <span class="text-slate-500 text-sm">None</span>
{:else if mode === 'text'}
  <span class="font-mono text-sm">{formatKeybind(input)}</span>
{:else if isGamepadInput(input)}
  <!-- Pretty mode for gamepad -->
  {#if mounted}
    <div class="flex items-center gap-2">
      {#if input.trigger !== undefined}
        <img 
          src={getGamepadButtonUrl(gamepadLayout, input.trigger, true)} 
          alt="Trigger button" 
          class="max-h-12 w-auto object-contain"
        />
        <span class="text-slate-400 text-lg font-bold">+</span>
      {/if}
      <img 
        src={getGamepadButtonUrl(gamepadLayout, input.button, true)} 
        alt="Button" 
        class="max-h-12 w-auto object-contain"
      />
    </div>
  {:else}
    <!-- Fallback to text if gamepad layout not configured -->
    <span class="font-mono text-sm text-slate-300">{formatKeybind(input)}</span>
  {/if}
{:else if isKeyboardInput(input)}
  <!-- Pretty mode for keyboard/mouse -->
  <div class="flex items-center gap-1.5">
    {#if input.ctrl}
      <kbd class="inline-flex items-center justify-center min-w-[2rem] px-2 py-1.5 text-xs font-semibold text-slate-200 bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600 rounded shadow-sm">
        Ctrl
      </kbd>
      {#if showPlus && (input.shift || input.alt || input.keyName || input.mouse !== undefined)}
        <span class="text-slate-400 text-lg font-bold">+</span>
      {/if}
    {/if}
    {#if input.shift}
      <Keycap>
        Shift
      </Keycap>
      {#if showPlus && (input.alt || input.keyName || input.mouse !== undefined)}
        <span class="text-slate-400 text-lg font-bold">+</span>
      {/if}
    {/if}
    {#if input.alt}
      <Keycap>
        Alt
      </Keycap>
      {#if showPlus && (input.keyName || input.mouse !== undefined)}
        <span class="text-slate-400 text-lg font-bold">+</span>
      {/if}
    {/if}
    {#if input.keyName}
      <Keycap>
        {input.keyName}
      </Keycap>
    {/if}
    {#if input.mouse !== undefined}
      <MouseButton button={input.mouse} />
    {/if}
  </div>
{/if}
