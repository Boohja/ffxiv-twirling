<script lang="ts">
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { flip } from 'svelte/animate'
  import { slide } from 'svelte/transition'
  import {rotations, type Rotation, type RotationStep} from '$lib/stores'
  import { get, writable } from 'svelte/store'
  import { onMount } from 'svelte'
  import {formatKeybind, hasKeybind, isModifierKey} from "$lib/helpers.js"
  import { Sound } from 'svelte-sound'
  import errorMp3 from '$lib/assets/sounds/error.mp3'
  import correctMp3 from '$lib/assets/sounds/correct.mp3'

  const rots = get(rotations)
  const errorSound = new Sound(errorMp3)
  const correctSound = new Sound(correctMp3)
  let rotation: Rotation
  let loading = true
  const settings = {
    showName: true,
    showIcon: true,
    showKeybind: true,
    playSounds: true
  }
  const snapshot = {
    alt: false,
    ctrl: false,
    shift: false,
    mouse: false,
    keyCode: ''
  }
  let recording = false
  let madeError = false
  const stepsStore = writable([] as RotationStep[])
  $: steps = $stepsStore
  $: currentIdx = 0
  $: currentStep = steps[currentIdx] as RotationStep
  $: nextStep = steps[currentIdx + 1] as RotationStep
  $: prevStep = steps[currentIdx - 1] as RotationStep

  onMount(async () => {
    const hit = rots.find(r => r.name === $page.params?.slug)
    if (hit === undefined) {
      await goto('/rotations')
      return
    }
    if (hit.steps.some(step => !hasKeybind(step.key))) {
      await goto('/rotations/' + hit.name)
      return
    }
    rotation = hit
    stepsStore.set(rotation.steps as RotationStep[])
    loading = false
  })

  function handleEvent (e: KeyboardEvent | MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (e.type === 'keydown') {
      const ke = e as KeyboardEvent
      snapshot.shift = ke.shiftKey
      snapshot.alt = ke.altKey
      snapshot.ctrl = ke.ctrlKey
      if (ke.code === 'Escape') {
        stopRecording()
      }
      else if (!isModifierKey(ke.key)) {
        snapshot.keyCode = ke.code
        validateSnapshot()
      }
    }
    else if (e.type === 'mouseup') {
      const me = e as MouseEvent
      snapshot.mouse = me.button
      validateSnapshot()
    }
    return false
  }

  /**
   * Whenever a key is pressed, check if it matches the current step.
   */
  function validateSnapshot () {
    if (snapshot.alt === currentStep.key.alt &&
      snapshot.ctrl === currentStep.key.ctrl &&
      snapshot.shift === currentStep.key.shift &&
      snapshot.keyCode === currentStep.key.keyCode) {
      if (settings.playSounds) {
        correctSound.play()
      }
      if (currentIdx === steps.length - 1) {
        stopRecording()
        return
      }
      else {
        currentIdx++
        currentStep = steps[currentIdx]
        nextStep = steps[currentIdx + 1]
        prevStep = steps[currentIdx - 1]
      }
    }
    else {
      playError()
    }
  }

  function playError () {
    if (settings.playSounds) {
      errorSound.play()
    }
    madeError = true
    setTimeout(() => {
      madeError = false
    }, 200)
  }

  function startRecording () {
    recording = true
    window.addEventListener('keydown', handleEvent)
    // window.addEventListener('keyup', handleEvent)
    window.addEventListener('mouseup', handleEvent)
    window.addEventListener('contextmenu', handleEvent)
  }

  function stopRecording () {
    recording = false
    currentIdx = 0
    window.removeEventListener('keydown', handleEvent)
    // window.removeEventListener('keyup', handleEvent)
    window.removeEventListener('mouseup', handleEvent)
    window.removeEventListener('contextmenu', handleEvent)
  }
</script>

<div class="absolute top-1 bottom-1 left-0 right-0 overflow-clip {madeError ? 'errorAnimation' : ''}">
  <div class="flex">
    <!-- col 1 -->
    <div class="flex-1 flex flex-col items-center justify-center h-screen scale-75 opacity-30">
      {#if !loading && recording && prevStep}
        {#if settings.showName}
          <div class="text-5xl drop-shadow-md mb-5 text-slate-400">
            {prevStep.name}
          </div>
        {/if}
        {#if settings.showIcon}
          <div class="w-80 h-80 {settings.showIcon ? '' : 'invisible'}">
            <img src={prevStep.icon} class="w-full h-full" alt="icon" />
          </div>
        {/if}
        {#if settings.showKeybind}
          <div class="text-7xl drop-shadow-md text-slate-400 mt-5 {settings.showKeybind ? '' : 'invisible'}">
            {formatKeybind(prevStep.key)}
          </div>
        {/if}
      {/if}
    </div>
    <!-- col 2 -->
    <div class="flex-1 flex flex-col items-center justify-center h-screen">
      {#if loading}
        LOADING...
      {:else if !recording}
        <div class="text-5xl drop-shadow-md mb-5 text-slate-400">
          {rotation.name}
        </div>
        <div class="drop-shadow-md mb-5 text-slate-400">
          {rotation.steps.length} steps
        </div>
        <div class="mb-3 text-2xl font-light text-slate-300">
          <label><input type="checkbox" bind:checked={settings.showName}> Show name</label><br>
          <label><input type="checkbox" bind:checked={settings.showIcon}> Show icon</label><br>
          <label><input type="checkbox" bind:checked={settings.showKeybind}> Show keybind</label><br>
          <label><input type="checkbox" bind:checked={settings.playSounds}> Play sounds</label>
        </div>
        <button class="mt-3 py-3 px-5 bg-teal-700 rounded-full text-white font-semibold" on:click={startRecording}>Begin twirling!</button><br>
        <div class="text-slate-300 mb-3">
          Press <kbd>ESC</kbd> to stop twirling
        </div>
        <a href={`/rotations/${rotation.name}`} class="mt-3 py-3 px-5 border border-teal-200 rounded-full text-white font-semibold">Go back</a>
      {:else if currentStep}
        <div class="absolute top-20 text-slate-500">
          Cancel with ESC
        </div>
        {#if settings.showName}
          <div class="text-5xl drop-shadow-md mb-5 text-slate-400">
            {currentStep.name}
          </div>
        {/if}
        {#if settings.showIcon}
          <div class="w-80 h-80 {settings.showIcon ? '' : 'invisible'}">
            <img src={currentStep.icon} class="w-full h-full" alt="icon" />
          </div>
        {/if}
        {#if settings.showKeybind}
          <div class="text-7xl drop-shadow-md text-teal-400 mt-5 {settings.showKeybind ? '' : 'invisible'}">
            {formatKeybind(currentStep.key)}
          </div>
        {/if}
      {/if}
    </div>
    <!-- col 3 -->
    <div class="flex-1 flex flex-col items-center justify-center h-screen scale-75 opacity-30">
      {#if !loading && recording && nextStep}
        {#if settings.showName}
          <div class="text-5xl drop-shadow-md mb-5 text-slate-400">
            {nextStep.name}
          </div>
        {/if}
        {#if settings.showIcon}
          <div class="w-80 h-80 {settings.showIcon ? '' : 'invisible'}">
            <img src={nextStep.icon} class="w-full h-full" alt="icon" />
          </div>
        {/if}
        {#if settings.showKeybind}
          <div class="text-7xl drop-shadow-md text-slate-400 mt-5 {settings.showKeybind ? '' : 'invisible'}">
            {formatKeybind(nextStep.key)}
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  @keyframes errorFlash {
    0% {
      background-color: red;
    }
    50% {
      background-color: transparent;
    }
    100% {
      background-color: red;
    }
  }
  .errorAnimation {
    animation: errorFlash 0.2s steps(2, end) 1;
  }
</style>