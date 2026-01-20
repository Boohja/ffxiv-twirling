<script lang="ts">
  import type { KeyboardInput, GamepadInput } from "$lib/stores";
  import { formatKeybind } from "$lib/helpers";
  import { getGamepadButtonUrl } from "$lib/iconLoader";
  import { onMount } from "svelte";

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
      <kbd class="inline-flex items-center justify-center min-w-[2rem] px-2 py-1.5 text-xs font-semibold text-slate-200 bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600 rounded shadow-sm">
        Shift
      </kbd>
      {#if showPlus && (input.alt || input.keyName || input.mouse !== undefined)}
        <span class="text-slate-400 text-lg font-bold">+</span>
      {/if}
    {/if}
    {#if input.alt}
      <kbd class="inline-flex items-center justify-center min-w-[2rem] px-2 py-1.5 text-xs font-semibold text-slate-200 bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600 rounded shadow-sm">
        Alt
      </kbd>
      {#if showPlus && (input.keyName || input.mouse !== undefined)}
        <span class="text-slate-400 text-lg font-bold">+</span>
      {/if}
    {/if}
    {#if input.keyName}
      <kbd class="inline-flex items-center justify-center min-w-[2rem] px-2 py-1.5 text-xs font-semibold text-slate-200 bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600 rounded shadow-sm">
        {input.keyName}
      </kbd>
    {/if}
    {#if input.mouse !== undefined}
      <kbd class="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-200 bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600 rounded shadow-sm">
        <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 2h2v6h-2V2zm0 14h2v6h-2v-6zM7.5 4.5C6.12 4.5 5 5.62 5 7v10c0 1.38 1.12 2.5 2.5 2.5h9c1.38 0 2.5-1.12 2.5-2.5V7c0-1.38-1.12-2.5-2.5-2.5h-9zM7 7c0-.55.45-1 1-1h3v4H7V7zm6-1h3c.55 0 1 .45 1 1v3h-4V6z"/>
        </svg>
        <span>{input.mouse + 1}</span>
      </kbd>
    {/if}
  </div>
{/if}
