<script lang="ts">
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import {rotations, type Rotation, type RotationStep} from '$lib/stores'
  import type { TwirlSettings } from '$lib/types/twirl'
  import { createDefaultTwirlSettings } from '$lib/types/twirl'
  import { get, writable } from 'svelte/store'
  import { onMount } from 'svelte'
  import { hasKeybind } from "$lib/helpers.js"
  import { Sound } from 'svelte-sound'
  import errorMp3 from '$lib/assets/sounds/error.mp3'
  import correctMp3 from '$lib/assets/sounds/correct.mp3'
	import { getJobIconUrl, getIconUrl } from '$lib/iconLoader'
  import InputRender from '$lib/components/twirling/InputRender.svelte'
  import TwirlConfig from '$lib/components/twirling/TwirlConfig.svelte'
  import TwirlCountdown from '$lib/components/twirling/TwirlCountdown.svelte'
  import { InputSnapshot } from '$lib/inputParser'
	import Keycap from '$lib/components/Keycap.svelte';
  const rots = get(rotations)
  const errorSound = new Sound(errorMp3)
  const correctSound = new Sound(correctMp3)
  let rotation: Rotation
  let loading = true
  let showConfig = false
  let showCountdown = false
  let settings: TwirlSettings = createDefaultTwirlSettings()
  let inputSnapshot: InputSnapshot | null = null
  let recording = false
  let madeError = false
  let currentInputIsCorrect = false
  let timeoutId: number | null = null
  let startTime: number = 0
  let elapsedTime: number = 0
  let timerInterval: number | null = null
  let completedSuccessfully = false
  
  const stepsStore = writable([] as RotationStep[])
  $: steps = $stepsStore
  $: currentIdx = 0
  $: currentStep = steps[currentIdx] as RotationStep
  $: nextStep = steps[currentIdx + 1] as RotationStep
  $: prevStep = steps[currentIdx - 1] as RotationStep
  $: progress = steps.length > 0 ? ((currentIdx / steps.length) * 100) : 0

  let gamepadAnimationFrameId: number | null = null

  onMount(async () => {
    const hit = rots.find(r => r.slug === $page.params?.slug)
    if (hit === undefined) {
      await goto('/rotations')
      return
    }
    if (hit.steps.some(step => !hasKeybind(step.input))) {
      await goto('/rotations/' + hit.name)
      return
    }
    rotation = hit
    stepsStore.set(rotation.steps as RotationStep[])
    loading = false
  })

  function playError () {
    if (settings.playSounds) {
      errorSound.play()
    }
    madeError = true
    setTimeout(() => madeError = false, 200)
    
    if (settings.errorBehavior === 'restart') {
      setTimeout(() => {
        stopRecording()
        showCountdown = true
      }, 300)
    } else if (settings.errorBehavior === 'continue') {
      // Move to next step even on error
      setTimeout(() => {
        if (currentIdx === steps.length - 1) {
          completedSuccessfully = false
          stopRecording()
          return
        }
        
        currentIdx++
        currentInputIsCorrect = false
        resetTimeout()
        setupTimeout()
        inputSnapshot?.reset()
      }, 300)
    }
    // For 'stay', do nothing - just remain on the current step
  }

  function setupTimeout() {
    if (settings.timeout > 0) {
      resetTimeout()
      timeoutId = window.setTimeout(() => {
        playError()
      }, settings.timeout * 1000)
    }
  }

  function resetTimeout() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  function startTimer() {
    startTime = Date.now()
    elapsedTime = 0
    timerInterval = window.setInterval(() => {
      elapsedTime = Math.floor((Date.now() - startTime) / 1000)
    }, 100)
  }

  function stopTimer() {
    if (timerInterval !== null) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function startRecording () {
    showCountdown = true
  }

  function pollGamepads() {
    if (!inputSnapshot || !recording) return
    const gamepads = navigator.getGamepads()
    inputSnapshot.processGamepads(gamepads)
    gamepadAnimationFrameId = requestAnimationFrame(pollGamepads)
  }

  function beginRecording() {
    recording = true
    completedSuccessfully = false
    showConfig = false
    currentIdx = 0
    currentInputIsCorrect = false
    setupTimeout()
    startTimer()
    
    // Initialize InputSnapshot
    inputSnapshot = new InputSnapshot()
    
    // Immediate feedback when a valid input is detected
    inputSnapshot.onValidSnapshot(() => {
      if (!recording || !currentStep.input) return
      
      const isMatch = inputSnapshot!.doesMatch(currentStep.input)
      currentInputIsCorrect = isMatch
      
      if (isMatch) {
        if (settings.playSounds) {
          correctSound.play()
        }
        resetTimeout()
      } else {
        playError()
      }
    })
    
    // Progress to next step when input is released (if it was correct)
    inputSnapshot.onRelease(() => {
      if (!recording || !currentInputIsCorrect) return
      
      if (currentIdx === steps.length - 1) {
        completedSuccessfully = true
        stopRecording()
        return
      }
      
      // Move to next step
      currentIdx++
      currentInputIsCorrect = false
      setupTimeout()
    })
    
    // Handle cancel (ESC key or button 9)
    inputSnapshot.onCancelInput(() => {
      if (recording) {
        stopRecording()
      }
    })
    
    // Set up event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', inputSnapshot.processKeyboardEvent)
      window.addEventListener('keyup', inputSnapshot.processKeyboardEvent)
      window.addEventListener('mousedown', inputSnapshot.processMouseEvent)
      window.addEventListener('mouseup', inputSnapshot.processMouseEvent)
      window.addEventListener('contextmenu', inputSnapshot.processMouseEvent)
    }
    
    // Start gamepad polling
    pollGamepads()
  }

  function stopRecording () {
    recording = false
    resetTimeout()
    stopTimer()
    currentIdx = 0
    
    // Clean up gamepad polling
    if (gamepadAnimationFrameId !== null) {
      cancelAnimationFrame(gamepadAnimationFrameId)
      gamepadAnimationFrameId = null
    }
    
    // Clean up event listeners
    if (inputSnapshot && typeof window !== 'undefined') {
      window.removeEventListener('keydown', inputSnapshot.processKeyboardEvent)
      window.removeEventListener('keyup', inputSnapshot.processKeyboardEvent)
      window.removeEventListener('mousedown', inputSnapshot.processMouseEvent)
      window.removeEventListener('mouseup', inputSnapshot.processMouseEvent)
      window.removeEventListener('contextmenu', inputSnapshot.processMouseEvent)
    }
    
    inputSnapshot = null
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function getStepIcon(step: RotationStep): string {
    if (!step.icon) return ''
    // If it's an action icon (from xiv assets), use getIconUrl
    if (step.action && !step.icon.startsWith('/images/')) {
      return getIconUrl(step.icon)
    }
    // Otherwise, use the path as-is (for custom /images/skills paths)
    return step.icon
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
  {#if loading}
    <div class="flex items-center justify-center h-screen">
      <div class="text-2xl text-slate-300">Loading...</div>
    </div>
  {:else if !recording}
    <!-- Configuration Panel -->
    <TwirlConfig 
      {rotation}
      bind:settings
      bind:showConfig
      {completedSuccessfully}
      {elapsedTime}
      on:click={startRecording}
    />
  {:else}
    <!-- Practice Mode -->
    <div class="absolute inset-0 {madeError ? 'errorAnimation' : ''}">
      <!-- Header with Progress -->
      <div class="absolute top-0 left-0 right-0 bg-slate-900/90 backdrop-blur border-b border-slate-700 z-10">
        <div class="max-w-7xl mx-auto px-6 py-4">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <img src={getJobIconUrl(rotation?.job)} alt={rotation?.job} class="h-10 w-10 rounded" />
              <div>
                <div class="text-sm text-slate-400">Practicing</div>
                <div class="font-semibold">{rotation.name}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-teal-400">{formatTime(elapsedTime)}</div>
              <div class="text-sm text-slate-400">Step {currentIdx + 1} / {steps.length}</div>
            </div>
          </div>
          <div class="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-teal-600 to-teal-400 transition-all duration-300" style="width: {progress}%"></div>
          </div>
        </div>
      </div>

      <!-- Practice Area -->
      <div class="flex items-center justify-center h-screen pt-24 pb-12">
        <div class="w-full max-w-7xl px-6">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            
            <!-- Previous Step (Left) -->
            <div class="flex flex-col items-center justify-center opacity-40 scale-90 transition-all">
              {#if prevStep}
                {#if settings.showIcon}
                  <div class="w-32 h-32 mb-4 rounded-lg overflow-hidden bg-slate-800/50 border border-slate-700">
                    <img src={getStepIcon(prevStep)} class="w-full h-full object-contain" alt={prevStep.name} />
                  </div>
                {/if}
                {#if settings.showName}
                  <div class="text-xl text-slate-400 text-center mb-2">
                    {prevStep.name || 'Previous'}
                  </div>
                {/if}
                {#if settings.showKeybind && prevStep.input}
                  <div class="flex justify-center">
                    <InputRender input={prevStep.input} mode="pretty" size="lg" />
                  </div>
                {/if}
              {:else}
                <div class="text-slate-600">—</div>
              {/if}
            </div>

            <!-- Current Step (Center) -->
            <div class="flex flex-col items-center justify-center transform scale-110">
              {#if currentStep}
                {#if settings.showIcon}
                  <div class="w-48 h-48 mb-6 rounded-2xl overflow-hidden bg-slate-800/80 border-4 border-teal-500 shadow-2xl shadow-teal-500/30 animate-pulse">
                    <img src={getStepIcon(currentStep)} class="w-full h-full object-contain" alt={currentStep.name} />
                  </div>
                {/if}
                {#if settings.showName}
                  <div class="text-4xl font-bold text-white text-center mb-4 drop-shadow-lg">
                    {currentStep.name || 'Action'}
                  </div>
                {/if}
                {#if settings.showKeybind && currentStep.input}
                  <div class="flex justify-center scale-125">
                    <InputRender input={currentStep.input} mode="pretty" showPlus={true} size="lg" />
                  </div>
                {/if}
              {/if}
            </div>

            <!-- Next Step (Right) -->
            <div class="flex flex-col items-center justify-center opacity-40 scale-90 transition-all">
              {#if nextStep}
                {#if settings.showIcon}
                  <div class="w-32 h-32 mb-4 rounded-lg overflow-hidden bg-slate-800/50 border border-slate-700">
                    <img src={getStepIcon(nextStep)} class="w-full h-full object-contain" alt={nextStep.name} />
                  </div>
                {/if}
                {#if settings.showName}
                  <div class="text-xl text-slate-400 text-center mb-2">
                    {nextStep.name || 'Next'}
                  </div>
                {/if}
                {#if settings.showKeybind && nextStep.input}
                  <div class="flex justify-center">
                    <InputRender input={nextStep.input} mode="pretty" size="lg" />
                  </div>
                {/if}
              {:else}
                <div class="text-slate-600">—</div>
              {/if}
            </div>

          </div>
        </div>
      </div>

      <!-- Footer Instructions -->
      <div class="absolute bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur border-t border-slate-700 py-4">
        <div class="text-center text-slate-400">
          Press <Keycap size="sm">ESC</Keycap> to stop practice
        </div>
      </div>
    </div>
  {/if}

  <!-- Countdown Overlay -->
  <TwirlCountdown bind:show={showCountdown} on:complete={beginRecording} />
</div>

<style>
  @keyframes errorFlash {
    0%, 100% {
      background-color: rgba(239, 68, 68, 0.3);
    }
    50% {
      background-color: transparent;
    }
  }
  
  @keyframes shake {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    10% { transform: translate(-4px, 2px) rotate(-0.5deg); }
    20% { transform: translate(4px, -2px) rotate(0.5deg); }
    30% { transform: translate(-3px, -3px) rotate(-0.3deg); }
    40% { transform: translate(3px, 3px) rotate(0.3deg); }
    50% { transform: translate(-2px, 1px) rotate(-0.2deg); }
    60% { transform: translate(2px, -1px) rotate(0.2deg); }
    70% { transform: translate(-1px, -2px) rotate(-0.1deg); }
    80% { transform: translate(1px, 2px) rotate(0.1deg); }
    90% { transform: translate(-1px, 1px) rotate(-0.05deg); }
  }
  
  .errorAnimation {
    animation: errorFlash 0.2s ease-in-out 2, shake 0.4s ease-in-out;
    overflow: hidden;
  }
</style>
