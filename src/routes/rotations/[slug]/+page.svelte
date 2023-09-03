<script lang="ts">
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { flip } from 'svelte/animate'
  import { slide } from 'svelte/transition'
  import {rotations, type Rotation, type RotationStep, type RotationStepKey} from '$lib/stores'
  import { get, writable } from 'svelte/store'
	 import EmptySlot from "$lib/components/twirling/EmptySlot.svelte"
	 import { onMount } from 'svelte'
  import Icon from 'svelte-icons-pack/Icon.svelte'
  import CgMouse from 'svelte-icons-pack/cg/CgMouse.js'
  import {formatKeybind, hasKeybind} from "$lib/helpers.js"

  const rots = get(rotations)
  let rotation: Rotation
  let jobActions: any[] = []
  let slotEditor: EmptySlot
  const stepsStore = writable([] as RotationStep[])
  $: steps = $stepsStore

  onMount(async () => {
    const hit = rots.find(r => r.name === $page.params?.slug)
    console.log('mounted rotation: ', rotation)
    if (hit === undefined) {
      await goto('/rotations')
      return
    }
    rotation = hit
    // const foo = await fetch('/api/actions/' + rotation.job)
    const foo = await import('$lib/assets/xiv/jobs/drg.json')
    jobActions = foo.default
    stepsStore.set(rotation.steps as RotationStep[])
    // console.log('mounted steps: ', steps)
  })

  function moveStep (idx: number, change: 1 | -1) {
    const newIdx = idx + change
    if (newIdx < 0 || newIdx >= steps.length) {
      return
    }
    stepsStore.update(existingSteps => {
      const newSteps = [...existingSteps]
      const temp = newSteps[idx]
      newSteps[idx] = newSteps[newIdx]
      newSteps[newIdx] = temp
      return newSteps
    })
  }

  $: canTwirl = $stepsStore.every(step => hasKeybind(step.key)) && $stepsStore.length > 0

  function newEntry (entry: RotationStep, propagateKeybind: boolean) {
    const newStep = {
      name: entry.name,
      icon: entry.icon,
      key: entry.key,
    }
    stepsStore.update(existingSteps => [...existingSteps, newStep])
    rotation.steps.push(newStep)
    // console.log('new entry steps: ', steps)
    // console.log('new entry rotation: ', rotation)
    // rotation.steps = steps
    rotations.set(rots)
    if (propagateKeybind) {
      copyKeybindToSteps(entry.key, entry.name)
    }
  }

  function updateEntry (idx: number, entry: RotationStep, propagateKeybind: boolean) {
    stepsStore.update(existingSteps => {
      const newSteps = [...existingSteps]
      newSteps[idx] = entry
      return newSteps
    })
    rotation.steps[idx] = entry
    rotations.set(rots)
    if (propagateKeybind) {
      copyKeybindToSteps(entry.key, entry.name)
    }
  }

  function copyKeybindToSteps (key: RotationStepKey, name: string) {
    stepsStore.update(existingSteps => {
      const newSteps = [...existingSteps]
      newSteps.forEach(step => {
        if (step.name === name) {
          step.key = key
        }
      })
      return newSteps
    })
    let changed = 0
    rotation.steps.forEach((step: RotationStep) => {
      if (step.name === name) {
        console.log('copying keybind to step: ', step.name)
        step.key = key
        changed++
      }
    })
    if (changed > 1) {
      rotations.set(rots)
    }

    // const hits: {[key: number]: RotationStep} = rotation.steps.reduce((acc, step: RotationStep, idx: number) => {
    //   if (step.name === name) {
    //     acc[idx] = step
    //   }
    //   return acc
    // }, {} as {[key: number]: RotationStep})
  }

  function goTwirl () {
    if (!canTwirl) {
      alert('Please assign a keybind to all steps before twirling')
      return
    }
    goto('/rotations/' + rotation.name + '/twirl')
  }
</script>


<div class="grid gap-4 grid-cols-2">
  <div class="border border-slate-500 p-3">
    <button class="mb-3 py-3 w-full px-5 border border-teal-700 hover:bg-teal-700 {canTwirl ? '' : 'opacity-40'} rounded-full text-white font-semibold" on:click={goTwirl}>Twirl</button>
    <div>
      {#each $stepsStore as step, idx (step)}
        <div
          class="step border rounded border-slate-600 mb-4 relative grid divide-x divide-slate-500 hover:bg-slate-700"
          animate:flip={{ duration: 200 }}
          transition:slide
        >
          <div class="align-middle" on:click={() => { slotEditor.editStep(idx, step) }} on:keypress={() => { slotEditor.editStep(idx, step) }}>
            <img src={step.icon} class="w-12" alt="" />
          </div>
          <div class="p-3" on:click={() => { slotEditor.editStep(idx, step) }} on:keypress={() => { slotEditor.editStep(idx, step) }}>
            {idx}: {step.name}<br>
            <div class="font-thin text-xs bg-opacity-40 {hasKeybind(step.key) ? 'bg-black' : 'bg-yellow-400' } px-2 py-1 inline-block rounded-full">
              <Icon src={CgMouse} className="inline" /> {formatKeybind(step.key) }
            </div>
          </div>
          <button
            class="hover:bg-slate-500"
            on:click={() => {
              stepsStore.update(existingSteps => existingSteps.filter((_, i) => i !== idx))
              rotation.steps = $stepsStore
              rotations.set(rots)
            }}
          >
            ✘
          </button>
          <button
            class="hover:bg-slate-500"
            disabled={idx === 0}
            on:click={() => {
              moveStep(idx, -1)
              rotation.steps = $stepsStore
              rotations.set(rots)
            }}
          >
            ▲
          </button>
          <button
            class="hover:bg-slate-500"
            disabled={idx === $stepsStore.length - 1}
            on:click={() => {
              moveStep(idx, 1)
              rotation.steps = $stepsStore
              rotations.set(rots)
            }}
          >
            ▼
          </button>
        </div>
      {/each}
    </div>
    {#if $stepsStore.length}
      <button class="mt-3 py-3 w-full px-5 border border-teal-700 hover:bg-teal-700 {canTwirl ? '' : 'opacity-40'} rounded-full text-white font-semibold" on:click={goTwirl}>Twirl</button>
    {/if}
  </div>
  <div>
    <EmptySlot
      on:newentry={(e) => newEntry(e.detail.step, e.detail.propagateKeybind)}
      on:updateentry={(e) => updateEntry(e.detail.idx, e.detail.step, e.detail.propagateKeybind)}
      bind:this={slotEditor}
      suggestions={jobActions}
    />
  </div>
</div>


<style>
  /* Your existing styles */

  /* Apply a CSS transition to the steps */
  .step {
    grid-template-columns: max-content auto max-content max-content max-content
  }
  .step button {
    width: 2.5rem;
    --tw-border-opacity: 1;
  }
  .step button[disabled] {
    opacity: 0.5;
  }
  .step button[disabled]:hover {
    background-color: transparent;
  }
</style>