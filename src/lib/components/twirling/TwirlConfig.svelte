<script lang="ts">
  import type { Rotation } from '$lib/stores'
  import type { TwirlSettings } from '$lib/types/twirl'
  import { getJobIconUrl } from '$lib/iconLoader'
	import Keycap from '../Keycap.svelte';
  import { Sound } from 'svelte-sound'
  import errorMp3 from '$lib/assets/sounds/error.mp3'
  import { onMount } from 'svelte'

  export let rotation: Rotation
  export let settings: TwirlSettings
  export let completedSuccessfully: boolean = false
  export let elapsedTime: number = 0
  export let showConfig: boolean = false
  export let lastTwirlIndex: number | null = null

  onMount(() => {
    // Expand config by default if it's the first time (no twirlConfig in localStorage)
    if (typeof localStorage !== 'undefined' && !localStorage.getItem('twirlConfig')) {
      showConfig = true
    }
  })

  function toggleConfig() {
    showConfig = !showConfig
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  $: errorSound = new Sound(errorMp3, { volume: settings.volume })

  function playVolumePreview() {
    if (settings.playSounds) {
      errorSound.play()
    }
  }
</script>

<div class="max-w-4xl mx-auto px-6 py-12">
  <!-- Header -->
  <div class="text-center mb-12">
    <div class="flex items-center justify-center gap-4 mb-6">
      <img src={getJobIconUrl(rotation?.job)} alt={rotation?.job || 'Job'} class="h-24 w-24 rounded-lg shadow-lg" />
      <div class="text-left">
        <h1 class="text-4xl font-bold text-white mb-2">{rotation.name}</h1>
        <p class="text-slate-400 text-lg">{rotation.steps.length} steps · {rotation.job.toUpperCase()}</p>
      </div>
    </div>
  </div>

  <!-- Configuration Card -->
  <div class="bg-slate-800/50 backdrop-blur rounded-2xl p-8 shadow-2xl border border-slate-700/50 mb-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold text-white">Practice Configuration</h2>
      <button 
        on:click={toggleConfig}
        class="text-sm text-teal-400 hover:text-teal-300 transition-colors"
      >
        {showConfig ? 'Hide' : 'Show'} Settings
      </button>
    </div>

    {#if showConfig}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <!-- Display Options -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-slate-300 mb-3">Display Options</h3>
          <label class="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              bind:checked={settings.showIcon}
              class="w-5 h-5 rounded border-slate-600 text-teal-500 focus:ring-teal-500 focus:ring-offset-slate-800"
            >
            <span class="text-slate-200 group-hover:text-white transition-colors">Show Action Icons</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              bind:checked={settings.showName}
              class="w-5 h-5 rounded border-slate-600 text-teal-500 focus:ring-teal-500 focus:ring-offset-slate-800"
            >
            <span class="text-slate-200 group-hover:text-white transition-colors">Show Action Names</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              bind:checked={settings.showKeybind}
              class="w-5 h-5 rounded border-slate-600 text-teal-500 focus:ring-teal-500 focus:ring-offset-slate-800"
            >
            <span class="text-slate-200 group-hover:text-white transition-colors">Show Keybinds</span>
          </label>
        </div>

        <!-- Behavior Options -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-slate-300 mb-3">Behavior Options</h3>
          <label class="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              bind:checked={settings.playSounds}
              class="w-5 h-5 rounded border-slate-600 text-teal-500 focus:ring-teal-500 focus:ring-offset-slate-800"
            >
            <span class="text-slate-200 group-hover:text-white transition-colors">Play Sounds</span>
          </label>

          {#if settings.playSounds}
            <div class="space-y-2 pl-8">
              <label for="volume-slider" class="block text-slate-200">
                Volume: {Math.round(settings.volume * 100)}%
              </label>
              <input 
                id="volume-slider"
                type="range" 
                bind:value={settings.volume}
                on:mouseup={playVolumePreview}
                on:touchend={playVolumePreview}
                min="0"
                max="1"
                step="0.01"
                class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
              >
            </div>
          {/if}
          
          <div class="space-y-2">
            <span class="block text-slate-200">Error Behavior</span>
            <div class="space-y-2">
              <label class="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" 
                  bind:group={settings.errorBehavior}
                  value="stay"
                  class="w-4 h-4 border-slate-600 text-teal-500 focus:ring-teal-500 focus:ring-offset-slate-800"
                >
                <span class="text-slate-200 group-hover:text-white transition-colors">Stay - Remain on step until correct input</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" 
                  bind:group={settings.errorBehavior}
                  value="continue"
                  class="w-4 h-4 border-slate-600 text-teal-500 focus:ring-teal-500 focus:ring-offset-slate-800"
                >
                <span class="text-slate-200 group-hover:text-white transition-colors">Continue - Show error but move to next step</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" 
                  bind:group={settings.errorBehavior}
                  value="restart"
                  class="w-4 h-4 border-slate-600 text-teal-500 focus:ring-teal-500 focus:ring-offset-slate-800"
                >
                <span class="text-slate-200 group-hover:text-white transition-colors">Restart - Start rotation over on error</span>
              </label>
            </div>
          </div>
          
          <div class="space-y-2">
            <label for="timeout-input" class="block text-slate-200">
              Timeout per Step (seconds, 0 = disabled)
            </label>
            <input 
              id="timeout-input"
              type="number" 
              bind:value={settings.timeout}
              min="0"
              max="60"
              step="0.5"
              class="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="0"
            >
          </div>
        </div>
      </div>
    {/if}

    <!-- Quick Settings Summary (when collapsed) -->
    {#if !showConfig}
      <div class="flex flex-wrap gap-2 mb-6">
        {#if settings.showIcon}
          <span class="px-3 py-1 bg-teal-900/30 text-teal-300 rounded-full text-sm">Icons</span>
        {/if}
        {#if settings.showName}
          <span class="px-3 py-1 bg-teal-900/30 text-teal-300 rounded-full text-sm">Names</span>
        {/if}
        {#if settings.showKeybind}
          <span class="px-3 py-1 bg-teal-900/30 text-teal-300 rounded-full text-sm">Keybinds</span>
        {/if}
        {#if settings.playSounds}
          <span class="px-3 py-1 bg-teal-900/30 text-teal-300 rounded-full text-sm">Sounds</span>
        {/if}
        {#if settings.errorBehavior === 'stay'}
          <span class="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-sm">Error: Stay</span>
        {:else if settings.errorBehavior === 'continue'}
          <span class="px-3 py-1 bg-purple-900/30 text-purple-300 rounded-full text-sm">Error: Continue</span>
        {:else if settings.errorBehavior === 'restart'}
          <span class="px-3 py-1 bg-amber-900/30 text-amber-300 rounded-full text-sm">Error: Restart</span>
        {/if}
        {#if settings.timeout > 0}
          <span class="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-sm">{settings.timeout}s timeout</span>
        {/if}
      </div>
    {/if}

    <!-- Action Buttons -->
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <button 
        class="px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-teal-500/50 transition-all transform hover:scale-105"
        on:click
      >
        Begin Practice Session
      </button>
      <a 
        href={`/rotations/${rotation.slug}`} 
        class="px-8 py-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl text-white font-semibold text-lg transition-all text-center"
      >
        Back to Rotation
      </a>
    </div>
  </div>

  <!-- Instructions -->
  <div class="text-center text-slate-400 text-sm">
    <p>Press the correct key/button sequence to progress through the rotation.</p>
    <p class="mt-1">Press <Keycap size="sm">ESC</Keycap> during practice to stop.</p>
  </div>

  {#if completedSuccessfully}
    <div class="mt-8 p-6 bg-green-900/30 border border-green-600/50 rounded-xl text-center">
      <div class="text-3xl font-bold text-green-400 mb-2">🎉 Perfect!</div>
      <div class="text-green-300 text-lg mb-4">
        Completed in {formatTime(elapsedTime)}
      </div>
      {#if lastTwirlIndex !== null}
        <a 
          href={`/twirls/${lastTwirlIndex}`}
          class="inline-block px-6 py-3 bg-teal-600 hover:bg-teal-500 rounded-lg text-white font-semibold transition-colors"
        >
          View Performance Details →
        </a>
      {/if}
    </div>
  {/if}
</div>
