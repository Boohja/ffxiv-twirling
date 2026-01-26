<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import RecordInput from './RecordInput.svelte';
  import type { KeyboardInput, GamepadInput } from '$lib/stores';
  import { getGamepadButtonUrl } from '$lib/iconLoader';
	import Keycap from '../Keycap.svelte';
	import { Icon } from 'svelte-icons-pack';
	import { LuLightbulb } from 'svelte-icons-pack/lu';

  export let once: boolean = false;
  export let showClear: boolean = false;

  const dispatch = createEventDispatcher<{
    input: KeyboardInput | GamepadInput | undefined;
    cancel: void;
  }>();

  let recordInputRef: RecordInput;
  let gamepadLayout: 'ps' | 'xbox' = 'ps'; // fallback

  onMount(() => {
    // Load gamepad layout from localStorage
    if (typeof localStorage !== 'undefined') {
      const layout = localStorage.getItem('gamepadLayout');
      gamepadLayout = (layout === 'xbox' ? 'xbox' : 'ps') as 'ps' | 'xbox';
    }
  });

  $: startButtonUrl = getGamepadButtonUrl(gamepadLayout, 9);

  export function startRecording() {
    if (recordInputRef) {
      recordInputRef.start();
    }
  }

  function handleInput(e?: CustomEvent<KeyboardInput | GamepadInput>) {
    dispatch('input', e?.detail);
  }

  function handleCancel() {
    dispatch('cancel');
  }

  function handleCancelButton(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    recordInputRef.stop();
    dispatch('cancel');
  }

  function handleClearButton(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    recordInputRef.stop();
    dispatch('input', undefined);
  }
</script>

<div class="space-y-4">
  <div class="text-slate-300 flex items-center gap-2 flex-wrap">
    <span>{#if !once}Record each step one by one. {/if} Press</span>
    <Keycap size="sm">Escape</Keycap>
    <span>or</span>
    {#if startButtonUrl}
      <img src={startButtonUrl} alt={gamepadLayout === 'ps' ? 'Options' : 'Start'} class="inline-block h-6 w-6" />
    {:else}
      <Keycap size="sm">{gamepadLayout === 'ps' ? 'Options' : 'Start'}</Keycap>
    {/if}
    <span>to cancel.</span>
    {#if !once}
      <p class="my-2 text-subtle">
        <Icon src={LuLightbulb} size="1.2rem" className="inline-block mr-1" />
        Just keep smashing buttons, we'll create missing steps for you!
      </p>
    {/if}
  </div>

  <RecordInput
    bind:this={recordInputRef}
    showDevice={false}
    cancellable={true}
    on:input={handleInput}
    on:cancel={handleCancel}
  />

  <div class="flex justify-center">
    <button
      type="button"
      class="py-2 px-6 border border-slate-600 rounded-full text-white font-semibold hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/50"
      on:click={handleCancelButton}
      on:mousedown={(e) => e.stopPropagation()}
      on:mouseup={(e) => e.stopPropagation()}
    >
      Cancel Recording
    </button>
    {#if showClear}
      <button
        type="button"
        class="ml-4 py-2 px-6 border border-red-600 rounded-full text-red-400 font-semibold hover:bg-red-700/30 focus:outline-none focus:ring-2 focus:ring-red-500/50"
        on:click={handleClearButton}
      >
        Clear Input
      </button>
    {/if}
  </div>
</div>
