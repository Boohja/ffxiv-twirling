<script lang="ts">
  import type {RotationStepKey} from "$lib/stores";
  import {deriveKeyName, formatKeybind, isModifierKey} from "$lib/helpers";
  import {createEventDispatcher} from "svelte";
  
  const dispatch = createEventDispatcher()
  let opened = false
  let recording = false
  let hasSnapshot = false
  let shift = false
  let alt = false
  let ctrl = false
  let mouse: false | number = false
  let keyCode = ''
  let keyName = ''
  let snapshot: RotationStepKey = {}

  export function show () {
    opened = true
    startRecording()
  }
  function close () {
    stopRecording()
    hasSnapshot = false
    snapshot = {}
    opened = false
  }
  function handleEvent (e: KeyboardEvent | MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (e.type === 'keydown' || e.type === 'keyup') {
      const ke = e as KeyboardEvent
      shift = ke.shiftKey
      alt = ke.altKey
      ctrl = ke.ctrlKey
      if (ke.code === 'Escape') {
        stopRecording()
      }
      else if (!isModifierKey(ke.key)) {
        keyCode = ke.code
        keyName = deriveKeyName(ke.key, ke.code)
        makeSnapshot()
        stopRecording()
      }
    }
    else if (e.type === 'mouseup') {
      const me = e as MouseEvent
      mouse = me.button
      makeSnapshot()
      stopRecording()
    }
    return false
  }

  function makeSnapshot () {
    hasSnapshot = true
    snapshot = {
      shift,
      alt,
      ctrl,
      mouse,
      keyCode,
      keyName
    }
  }

  function startRecording () {
    recording = true
    snapshot = {}
    hasSnapshot = false

    window.addEventListener('keydown', handleEvent)
    window.addEventListener('keyup', handleEvent)
    window.addEventListener('mouseup', handleEvent)
    window.addEventListener('contextmenu', handleEvent)
  }

  function stopRecording () {
    recording = false
    window.removeEventListener('keydown', handleEvent)
    window.removeEventListener('keyup', handleEvent)
    window.removeEventListener('mouseup', handleEvent)
    window.removeEventListener('contextmenu', handleEvent)

    shift = false
    alt = false
    ctrl = false
    mouse = false
    keyCode = ''
    keyName = ''
  }

  function submit () {
    if (!hasSnapshot || recording) return
    dispatch('keybind', snapshot)
    close()
  }
</script>

<div class="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-50 py-10 {opened ? '' : 'hidden'}">
    <div class="max-h-full w-full max-w-xl overflow-y-auto sm:rounded-2xl bg-slate-400">
        <div class="w-full">
            <div class="m-8 my-20 max-w-[400px] mx-auto">
                <div class="mb-8">
                    <h1 class="mb-4 text-3xl font-extrabold text-slate-700">Record a keybind</h1>
                    <p class="text-gray-600">We try to detect what you're doing, no guarantee though</p>
                </div>
                <div class="border border-slate-900 p-3 mb-8 h-14 text-black font-bold text-center">
                  {#if !recording && !hasSnapshot}
                    Nothing yet.
                  {:else if recording && !ctrl && !shift && !alt && !keyName && mouse === false}
                    Press keys or click mouse buttons
                  {:else if !recording && hasSnapshot}
                    { formatKeybind(snapshot) }
                  {/if}
                    {#if ctrl}
                        <kbd>Ctrl</kbd>
                    {/if}
                    {#if shift}
                        <kbd>Shift</kbd>
                    {/if}
                    {#if alt}
                        <kbd>Alt</kbd>
                    {/if}
                    {#if keyName}
                        <kbd>{keyName}</kbd>
                    {/if}
                    {#if mouse !== false}
                      <kbd>Mouse{mouse+1}</kbd>
                    {/if}
                </div>
                <div class="space-y-4">
                  <button class="p-3 bg-black rounded-full text-white w-full font-semibold" on:click={startRecording}>{ recording ? 'Recording, ESC to cancel' : 'Start recording'}</button>
                  <button class="p-3 { hasSnapshot ? '' : 'disabled opacity-20'} bg-teal-700 rounded-full text-white w-full font-semibold" on:click={submit}>Yes, that's it!</button>
                  <button class="p-3 bg-transparent border border-white rounded-full w-full font-semibold" on:click={close}>Cancel</button>
                </div>
            </div>
        </div>
    </div>
</div>