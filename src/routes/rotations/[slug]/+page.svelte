<script lang="ts">
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { rotations, type Rotation, type RotationStep, type KeyboardInput, type GamepadInput } from '$lib/stores'
  import { get, writable } from 'svelte/store'
	import SlotEditor from "$lib/components/twirling/SlotEditor.svelte";
  import RotationStepList from "$lib/components/twirling/RotationStepList.svelte";
  import { onMount } from 'svelte'
  import PageTitle from '$lib/components/page/PageTitle.svelte'
  import { Icon } from 'svelte-icons-pack'
  import { BiChevronLeft } from 'svelte-icons-pack/bi'
  import { hasKeybind } from "$lib/helpers.js"
  import { getIconUrl, loadJobActions, getJobIconUrl } from '$lib/iconLoader'

  const rots = get(rotations)
  let rotation: Rotation
  let jobActions: any[] = []
  let slotEditor: SlotEditor
  const stepsStore = writable([] as RotationStep[])
  $: steps = $stepsStore
  let loading = true
  let selectedIdx: number | null = null

  $: jobIconUrl = rotation?.job ? getJobIconUrl(rotation.job) : ''

  onMount(async () => {
    try {
      const rot = rots.find(r => r.slug === $page.params?.slug)
      if (rot === undefined) {
        await goto('/rotations')
        return
      }
      rotation = rot
      const actions = await loadJobActions(rotation.job)
      console.log(rotation)
      jobActions = actions
      stepsStore.set(rotation.steps as RotationStep[])
    }
    finally {
      loading = false
    }
  })

  function selectStep (idx: number, step: RotationStep) {
    // Toggle selection: clicking the same selected step deselects and clears editor
    if (selectedIdx === idx) {
      selectedIdx = null
      slotEditor.reset()
      return
    }
    selectedIdx = idx
    slotEditor.editStep(idx, step)
  }

  function handleReorder (detail: { from: number, to: number }) {
    const { from, to } = detail
    
    let updated: RotationStep[] = []
    stepsStore.update(existingSteps => {
      const ns = [...existingSteps]
      const [moved] = ns.splice(from, 1)
      ns.splice(to, 0, moved)
      updated = ns
      return ns
    })
    
    // Maintain selection on the moved item
    if (selectedIdx != null) {
      if (selectedIdx === from) {
        selectedIdx = to
      } else if (from < to) {
        // Items between from+1..to shift up by 1
        if (selectedIdx > from && selectedIdx <= to) selectedIdx = selectedIdx - 1
      } else if (from > to) {
        // Items between to..from-1 shift down by 1
        if (selectedIdx >= to && selectedIdx < from) selectedIdx = selectedIdx + 1
      }
    }
    
    rotation.steps = updated
    rotations.set(rots)
  }

  function handleSelectStep (detail: { idx: number, step: RotationStep }) {
    selectStep(detail.idx, detail.step)
  }

  function handleDeleteStep (detail: { idx: number }) {
    stepsStore.update(existingSteps => existingSteps.filter((_, i) => i !== detail.idx))
    rotation.steps = $stepsStore
    rotations.set(rots)
  }

  $: canTwirl = $stepsStore.every(step => hasKeybind(step.input)) && $stepsStore.length > 0

  function newEntry (entry: RotationStep, propagateKeybind: boolean) {
    const newStep = {
      name: entry.name,
      icon: entry.icon,
      input: entry.input,
      action: (entry as any).action
    }
    stepsStore.update(existingSteps => [...existingSteps, newStep])
    rotation.steps.push(newStep)
    // console.log('new entry steps: ', steps)
    // console.log('new entry rotation: ', rotation)
    // rotation.steps = steps
    rotations.set(rots)
    if (propagateKeybind && entry.input) {
      copyKeybindToSteps(entry.input, entry.name)
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
    if (propagateKeybind && entry.input) {
      copyKeybindToSteps(entry.input, entry.name)
    }
  }

  function copyKeybindToSteps (input: KeyboardInput | GamepadInput, name: string) {
    stepsStore.update(existingSteps => {
      const newSteps = [...existingSteps]
      newSteps.forEach(step => {
        if (step.name === name) {
          step.input = input
        }
      })
      return newSteps
    })
    let changed = 0
    rotation.steps.forEach((step: RotationStep) => {
      if (step.name === name) {
        console.log('copying keybind to step: ', step.name)
        step.input = input
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

{#if loading}
  <div class="p-8 text-center text-slate-300 absolute top-0 bottom-0 left-0 right-0 bg-slate-900 z-10" aria-busy="true">
    Loading...
  </div>
{/if}

<div class="p-4 border border-slate-900/60 rounded mb-8 bg-slate-900/40">
  <PageTitle>
    <div class="flex items-center gap-3">
      <a href="/rotations" class="inline-flex items-center justify-center rounded hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50">
        <Icon src={BiChevronLeft} size="1.5em" />
      </a>
      <div class="flex items-center gap-3">
        {#if jobIconUrl}
          <img src={jobIconUrl} alt={rotation?.job || 'Job'} class="h-8 w-8 shrink-0 rounded" />
        {:else}
          <div class="h-8 w-8 shrink-0 rounded bg-slate-700"></div>
        {/if}
        <span>{rotation?.name}</span>
      </div>
    </div>
  </PageTitle>
</div>

<div class="grid gap-4 grid-cols-2">
  <div class="border border-slate-500 p-3 mb-5">
    <RotationStepList
      steps={$stepsStore}
      {selectedIdx}
      iconUrl={getIconUrl}
      on:reorder={(e) => handleReorder(e.detail)}
      on:selectstep={(e) => handleSelectStep(e.detail)}
      on:deletestep={(e) => handleDeleteStep(e.detail)}
    />
    <div class="pt-3 mt-3 border-t border-slate-700">
      <button class="py-3 w-full px-5 border border-teal-700 hover:bg-teal-700 {canTwirl ? '' : 'opacity-40'} rounded-full text-white font-semibold" on:click={goTwirl}>Twirl</button>
    </div>
  </div>
  <div class="p-4 border border-slate-900/60 rounded mb-8 bg-slate-900/40 sticky top-4 self-start">
    <SlotEditor
      on:newentry={(e) => newEntry(e.detail.step, e.detail.propagateKeybind)}
      on:updateentry={(e) => updateEntry(e.detail.idx, e.detail.step, e.detail.propagateKeybind)}
      on:deletestep={(e) => handleDeleteStep(e.detail)}
      bind:this={slotEditor}
      suggestions={jobActions}
      existingSteps={$stepsStore}
    />
  </div>

</div>
