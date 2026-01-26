<script lang="ts">
  import type { KeyboardInput, GamepadInput, MouseInput } from "$lib/stores";
  import { formatKeybind } from "$lib/helpers";
  import { getGamepadButtonUrl } from "$lib/iconLoader";
  import { onMount } from "svelte";
	import Keycap from "../Keycap.svelte";
	import MouseButton from "../MouseButton.svelte";

  export let input: KeyboardInput | GamepadInput | undefined = undefined;
  export let mode: 'text' | 'pretty' = 'pretty';
  export let showPlus: boolean = false;
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';

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

  const gamepadSizes = {
    sm: { height: 6, large: false },
    md: { height: 8, large: false },
    lg: { height: 10, large: true },
    xl: { height: 64, large: true }
  }

  $: gamepadDimension = gamepadSizes[size];

  function isGamepadInput(input: KeyboardInput | GamepadInput | undefined): input is GamepadInput {
    return input !== undefined && ('button' in input || 'trigger' in input);
  }

  function isKeyboardInput(input: KeyboardInput | GamepadInput | undefined): input is KeyboardInput & MouseInput {
    return input !== undefined && !('button' in input) && !('trigger' in input);
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
          src={getGamepadButtonUrl(gamepadLayout, input.trigger, gamepadDimension.large)} 
          alt="Trigger button" 
          class="h-{gamepadDimension.height} w-auto object-contain"
        />
        {#if input.button !== undefined}
          <span class="text-slate-400 text-lg font-bold">+</span>
        {/if}
      {/if}
      {#if input.button !== undefined}
        <img 
          src={getGamepadButtonUrl(gamepadLayout, input.button, gamepadDimension.large)} 
          alt="Button" 
          class="h-{gamepadDimension.height} w-auto object-contain"
        />
      {/if}
    </div>
  {:else}
    <!-- Fallback to text if gamepad layout not configured -->
    <span class="font-mono text-sm text-slate-300">{formatKeybind(input)}</span>
  {/if}
{:else if isKeyboardInput(input)}
  <!-- Pretty mode for keyboard/mouse -->
  <div class="flex items-center gap-1.5">
    {#if input.ctrl}
      <Keycap {size}>
        Ctrl
      </Keycap>
      {#if showPlus && (input.shift || input.alt || input.keyName || input.mouse !== undefined)}
        <span class="text-slate-400 text-lg font-bold">+</span>
      {/if}
    {/if}
    {#if input.shift}
      <Keycap {size}>
        Shift
      </Keycap>
      {#if showPlus && (input.alt || input.keyName || input.mouse !== undefined)}
        <span class="text-slate-400 text-lg font-bold">+</span>
      {/if}
    {/if}
    {#if input.alt}
      <Keycap {size}>
        Alt
      </Keycap>
      {#if showPlus && (input.keyName || input.mouse !== undefined)}
        <span class="text-slate-400 text-lg font-bold">+</span>
      {/if}
    {/if}
    {#if input.keyName}
      <Keycap {size}>
        {input.keyName}
      </Keycap>
    {/if}
    {#if input.mouse !== undefined}
      <MouseButton button={input.mouse} {size} />
    {/if}
  </div>
{/if}
