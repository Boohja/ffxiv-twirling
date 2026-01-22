<script lang="ts">
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import {rotations, twirls, twirlConfig, type Rotation, type RotationStep, type CombinedInput, type TwirlRecording, type TwirlStep, type TwirlInput} from '$lib/stores'
  import type { TwirlSettings } from '$lib/types/twirl'
  import { get, writable } from 'svelte/store'
  import { onMount } from 'svelte'
  import { hasKeybind } from "$lib/helpers.js"
  import { Sound } from 'svelte-sound'
  import errorMp3 from '$lib/assets/sounds/error.mp3'
  import correctMp3 from '$lib/assets/sounds/correct.mp3'
  import timeoutMp3 from '$lib/assets/sounds/timeout.mp3'
	import { getJobIconUrl, getIconUrl } from '$lib/iconLoader'
  import InputRender from '$lib/components/twirling/InputRender.svelte'
  import TwirlConfig from '$lib/components/twirling/TwirlConfig.svelte'
  import TwirlCountdown from '$lib/components/twirling/TwirlCountdown.svelte'
  import { InputSnapshot } from '$lib/inputParser'
	import Keycap from '$lib/components/Keycap.svelte';
  const rots = get(rotations)
  
  $: errorSound = new Sound(errorMp3, { volume: $twirlConfig.volume })
  $: correctSound = new Sound(correctMp3, { volume: $twirlConfig.volume })
  $: timeoutSound = new Sound(timeoutMp3, { volume: $twirlConfig.volume })
  
  let rotation: Rotation
  let loading = true
  let showConfig = false
  let showCountdown = false
  let inputSnapshot: InputSnapshot | null = null
  let recording = false
  let madeError = false
  let currentInputIsCorrect = false
  let timeoutId: number | null = null
  let startTime: number = 0
  let elapsedTime: number = 0
  let timerInterval: number | null = null
  let completedSuccessfully = false
  
  // Twirl recording state
  let twirlRecording: TwirlRecording | null = null
  let currentStepRecording: TwirlStep | null = null
  let currentStepStartTime: number = 0
  let lastInputTime: number = 0
  let lastTwirlIndex: number | null = null
  let timeoutStartTime: number = 0
  let timeoutProgress: number = 0
  let timeoutAnimationFrame: number | null = null
  
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
    if ($twirlConfig.playSounds) {
      errorSound.play()
    }
    madeError = true
    setTimeout(() => madeError = false, 200)
    
    if ($twirlConfig.errorBehavior === 'restart') {
      setTimeout(() => {
        stopRecording()
        showCountdown = true
      }, 300)
    } else if ($twirlConfig.errorBehavior === 'continue') {
      // Move to next step even on error
      setTimeout(() => {
        if (currentIdx === steps.length - 1) {
          completedSuccessfully = false
          stopRecording(true)
          return
        }
        
        // Save current step recording before moving on
        if (currentStepRecording) {
          finishCurrentStepRecording()
        }
        
        currentIdx++
        currentInputIsCorrect = false
        resetTimeout()
        setupTimeout()
        inputSnapshot?.reset()
        
        // Start recording next step
        startStepRecording()
      }, 300)
    }
    // For 'stay', do nothing - just remain on the current step
  }

  function playTimeout () {
    if ($twirlConfig.playSounds) {
      timeoutSound.play()
    }
    madeError = true
    setTimeout(() => madeError = false, 200)
    
    // Mark the current step as timed out
    if (currentStepRecording) {
      currentStepRecording.timeout = true
    }
    
    if ($twirlConfig.errorBehavior === 'restart') {
      setTimeout(() => {
        stopRecording()
        showCountdown = true
      }, 300)
    } else if ($twirlConfig.errorBehavior === 'continue') {
      // Move to next step even on timeout
      setTimeout(() => {
        if (currentIdx === steps.length - 1) {
          completedSuccessfully = false
          stopRecording(true)
          return
        }
        
        // Save current step recording before moving on
        if (currentStepRecording) {
          finishCurrentStepRecording()
        }
        
        currentIdx++
        currentInputIsCorrect = false
        resetTimeout()
        setupTimeout()
        inputSnapshot?.reset()
        
        // Start recording next step
        startStepRecording()
      }, 300)
    }
    // For 'stay', do nothing - just remain on the current step
  }

  function setupTimeout() {
    if ($twirlConfig.timeout > 0) {
      resetTimeout()
      timeoutStartTime = Date.now()
      timeoutProgress = 0
      
      // Start animation frame for timeout visualization
      const updateTimeoutProgress = () => {
        const elapsed = Date.now() - timeoutStartTime
        const total = $twirlConfig.timeout * 1000
        timeoutProgress = Math.min(1, elapsed / total)
        
        if (timeoutProgress < 1 && recording) {
          timeoutAnimationFrame = requestAnimationFrame(updateTimeoutProgress)
        }
      }
      timeoutAnimationFrame = requestAnimationFrame(updateTimeoutProgress)
      
      timeoutId = window.setTimeout(() => {
        playTimeout()
      }, $twirlConfig.timeout * 1000)
    }
  }

  function resetTimeout() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    if (timeoutAnimationFrame !== null) {
      cancelAnimationFrame(timeoutAnimationFrame)
      timeoutAnimationFrame = null
    }
    timeoutProgress = 0
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
    
    // Initialize twirl recording
    initializeTwirlRecording()
    
    // Initialize InputSnapshot
    inputSnapshot = new InputSnapshot()
    
    // Immediate feedback when a valid input is detected
    inputSnapshot.onValidSnapshot(() => {
      if (!recording || !currentStep.input) return
      
      const isMatch = inputSnapshot!.doesMatch(currentStep.input)
      currentInputIsCorrect = isMatch
      
      // Record the input
      recordInput(inputSnapshot!.currentInput, isMatch)
      
      if (isMatch) {
        if ($twirlConfig.playSounds) {
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
        stopRecording(true)
        return
      }
      
      // Save current step recording before moving on
      if (currentStepRecording) {
        finishCurrentStepRecording()
      }
      
      // Move to next step
      currentIdx++
      currentInputIsCorrect = false
      setupTimeout()
      
      // Start recording next step
      startStepRecording()
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

  function stopRecording (finished: boolean = false) {
    recording = false
    resetTimeout()
    stopTimer()
    
    // Finish and save the twirl recording
    if (twirlRecording) {
      // Finish current step if exists
      if (currentStepRecording) {
        finishCurrentStepRecording()
      }
      
      // Save twirl recording
      saveTwirlRecording(finished)
    }
    
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

  // Twirl recording functions
  function initializeTwirlRecording() {
    const now = new Date().toISOString()
    twirlRecording = {
      config: { ...$twirlConfig },
      startedAt: now,
      endedAt: '',
      rotation: {
        slug: rotation.slug,
        name: rotation.name,
        job: rotation.job
      },
      steps: rotation.steps.map(step => ({
        original: step,
        inputs: [],
        duration: 0,
        correct: false
      })),
      duration: 0,
      correct: false
    }
    
    // Start recording the first step
    startStepRecording()
  }

  function startStepRecording() {
    currentStepStartTime = Date.now()
    lastInputTime = currentStepStartTime
    // Reference the existing step in the array
    if (twirlRecording) {
      currentStepRecording = twirlRecording.steps[currentIdx]
    }
  }

  function recordInput(input: CombinedInput, correct: boolean) {
    if (!currentStepRecording) return
    
    const now = Date.now()
    const delta = now - lastInputTime
    lastInputTime = now
    
    currentStepRecording.inputs.push({
      input: { ...input },
      delta,
      correct
    })
  }

  function finishCurrentStepRecording() {
    if (!currentStepRecording || !twirlRecording) return
    
    currentStepRecording.duration = Date.now() - currentStepStartTime
    // Calculate if step was completed correctly
    // Only true if: has inputs AND all inputs are correct
    // Note: timeout flag is informational - with "stay" behavior, user can still provide correct input after timeout
    currentStepRecording.correct = currentStepRecording.inputs.length > 0 && 
      currentStepRecording.inputs.every(input => input.correct)
    // Step is already in the array, no need to push
    currentStepRecording = null
  }

  function saveTwirlRecording(finished: boolean = false) {
    if (!twirlRecording) return
    
    const now = new Date().toISOString()
    twirlRecording.endedAt = now
    twirlRecording.duration = Date.now() - startTime
    twirlRecording.finished = finished
    
    // Calculate if the twirl was completed correctly
    // Must have completed successfully AND all steps must be correct
    twirlRecording.correct = completedSuccessfully && 
      twirlRecording.steps.every(step => step.correct)
    
    // Save to localStorage via persisted store and get index
    const currentTwirls = get(twirls)
    lastTwirlIndex = currentTwirls.length
    twirls.update(current => [...current, twirlRecording!])
    
    console.log('Twirl recording saved:', twirlRecording, 'at index:', lastTwirlIndex)
    
    // Reset recording state
    twirlRecording = null
    currentStepRecording = null
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
      bind:settings={$twirlConfig}
      bind:showConfig
      {completedSuccessfully}
      {elapsedTime}
      {lastTwirlIndex}
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
                {#if $twirlConfig.showIcon}
                  <div class="w-32 h-32 mb-4 rounded-lg overflow-hidden bg-slate-800/50 border border-slate-700">
                    <img src={getStepIcon(prevStep)} class="w-full h-full object-contain" alt={prevStep.name} />
                  </div>
                {:else}
                  <div class="w-32 h-32 mb-4 rounded-lg bg-slate-800/30 border border-slate-700 flex items-center justify-center">
                    <span class="text-5xl text-slate-600 font-bold">?</span>
                  </div>
                {/if}
                {#if $twirlConfig.showName}
                  <div class="text-xl text-slate-400 text-center mb-2">
                    {prevStep.name || 'Previous'}
                  </div>
                {/if}
                {#if $twirlConfig.showKeybind && prevStep.input}
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
                {#if $twirlConfig.showIcon}
                  <div class="w-48 h-48 mb-6 rounded-2xl overflow-hidden bg-slate-800/80 border-4 border-teal-500 shadow-2xl shadow-teal-500/30 animate-pulse relative">
                    <img src={getStepIcon(currentStep)} class="w-full h-full object-contain" alt={currentStep.name} />
                    {#if $twirlConfig.timeout > 0 && timeoutProgress > 0}
                      <div 
                        class="absolute inset-0 rounded-2xl"
                        style="background: conic-gradient(from 0deg at 50% 50%, rgba(0, 0, 0, 0.75) 0deg, rgba(0, 0, 0, 0.75) {timeoutProgress * 360}deg, transparent {timeoutProgress * 360}deg);"
                      ></div>
                    {/if}
                  </div>
                {:else}
                  <div class="w-48 h-48 mb-6 rounded-2xl bg-slate-800/50 border-4 border-teal-500 shadow-2xl shadow-teal-500/30 animate-pulse flex items-center justify-center relative">
                    <span class="text-8xl text-slate-600 font-bold">?</span>
                    {#if $twirlConfig.timeout > 0 && timeoutProgress > 0}
                      <div 
                        class="absolute inset-0 rounded-2xl"
                        style="background: conic-gradient(from 0deg at 50% 50%, rgba(0, 0, 0, 0.75) 0deg, rgba(0, 0, 0, 0.75) {timeoutProgress * 360}deg, transparent {timeoutProgress * 360}deg);"
                      ></div>
                    {/if}
                  </div>
                {/if}
                {#if $twirlConfig.showName}
                  <div class="text-4xl font-bold text-white text-center mb-4 drop-shadow-lg">
                    {currentStep.name || 'Action'}
                  </div>
                {/if}
                {#if $twirlConfig.showKeybind && currentStep.input}
                  <div class="flex justify-center scale-125">
                    <InputRender input={currentStep.input} mode="pretty" showPlus={true} size="lg" />
                  </div>
                {/if}
              {/if}
            </div>

            <!-- Next Step (Right) -->
            <div class="flex flex-col items-center justify-center opacity-40 scale-90 transition-all">
              {#if nextStep}
                {#if $twirlConfig.showIcon}
                  <div class="w-32 h-32 mb-4 rounded-lg overflow-hidden bg-slate-800/50 border border-slate-700">
                    <img src={getStepIcon(nextStep)} class="w-full h-full object-contain" alt={nextStep.name} />
                  </div>
                {:else}
                  <div class="w-32 h-32 mb-4 rounded-lg bg-slate-800/30 border border-slate-700 flex items-center justify-center">
                    <span class="text-5xl text-slate-600 font-bold">?</span>
                  </div>
                {/if}
                {#if $twirlConfig.showName}
                  <div class="text-xl text-slate-400 text-center mb-2">
                    {nextStep.name || 'Next'}
                  </div>
                {/if}
                {#if $twirlConfig.showKeybind && nextStep.input}
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
  <TwirlCountdown bind:show={showCountdown} playSounds={$twirlConfig.playSounds} volume={$twirlConfig.volume} on:complete={beginRecording} />
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
