<script lang="ts">
  import { page } from '$app/stores'
  import { goto, invalidate } from '$app/navigation'
  import { rotations, type Rotation, type RotationStep, type KeyboardInput, type GamepadInput } from '$lib/stores'
  import { get, writable } from 'svelte/store'
	import SlotEditor from "$lib/components/twirling/SlotEditor.svelte";
  import SlotRecorder from "$lib/components/twirling/SlotRecorder.svelte";
  import RotationStepList from "$lib/components/twirling/RotationStepList.svelte";
  import { onMount, tick } from 'svelte'
  import PageTitle from '$lib/components/page/PageTitle.svelte'
  import { Icon } from 'svelte-icons-pack'
  import { BiChevronLeft } from 'svelte-icons-pack/bi'
  import { createSlug, hasKeybind, isValidRotationName } from "$lib/helpers.js"
  import { getIconUrl, loadJobActions, getJobIconUrl } from '$lib/iconLoader'
	import { LuChevronLeft } from 'svelte-icons-pack/lu';
	import Button from '$lib/components/form/Button.svelte';
	import Container from '$lib/components/form/Container.svelte';

  const rots = get(rotations)
  let rotation: Rotation
  let jobActions: any[] = []
  let slotEditor: SlotEditor
  let slotRecorder: SlotRecorder
  const stepsStore = writable([] as RotationStep[])
  $: steps = $stepsStore
  let loading = true
  let selectedIdx: number | null = null
  let isRecording = false
  let recordSingle = false

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
    rotation.updatedAt = new Date().toISOString()
    rotations.set(rots)
  }

  function handleSelectStep (detail: { idx: number, step: RotationStep }) {
    selectStep(detail.idx, detail.step)
  }

  async function handleRecordStep (detail: { idx: number, step: RotationStep }) {
    isRecording = true
    selectedIdx = detail.idx
    recordSingle = true
    await tick()
    if (slotRecorder) {
      slotRecorder.startRecording()
    }
  }

  function handleDeleteStep (detail: { idx: number }) {
    stepsStore.update(existingSteps => existingSteps.filter((_, i) => i !== detail.idx))
    rotation.steps = $stepsStore
    rotation.updatedAt = new Date().toISOString()
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
    rotation.updatedAt = new Date().toISOString()
    rotations.set(rots)
    if (propagateKeybind && entry.input) {
      copyKeybindToSteps(entry.input, entry.name)
    }
    scrollToStep(rotation.steps.length - 1)
  }

  function updateEntry (idx: number, entry: RotationStep, propagateKeybind: boolean) {
    stepsStore.update(existingSteps => {
      const newSteps = [...existingSteps]
      newSteps[idx] = entry
      return newSteps
    })
    rotation.steps[idx] = entry
    rotation.updatedAt = new Date().toISOString()
    rotations.set(rots)
    if (propagateKeybind && entry.input) {
      copyKeybindToSteps(entry.input, entry.name)
    }
    selectedIdx = null
    slotEditor.reset()
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
        step.input = input
        changed++
      }
    })
    if (changed > 1) {
      rotations.set(rots)
    }
  }

  function goTwirl () {
    if (!canTwirl) {
      alert('Please assign a keybind to all steps before twirling')
      return
    }
    goto('/rotations/' + rotation.slug + '/twirl')
  }

  async function startRecording() {
    isRecording = true
    recordSingle = false
    const startIdx = selectedIdx !== null ? selectedIdx : 0
    selectedIdx = null
    await tick()
    
    // Select the starting step if it exists
    if ($stepsStore.length > 0 && startIdx < $stepsStore.length) {
      selectedIdx = startIdx
      await scrollToStep(startIdx)
    } else if ($stepsStore.length > 0) {
      // If startIdx was out of bounds, start from first step
      selectedIdx = 0
      await scrollToStep(0)
    }
    
    // Start recording
    if (slotRecorder) {
      slotRecorder.startRecording()
    }
  }

  function stopRecording() {
    isRecording = false
    selectedIdx = null
    slotEditor?.reset()
  }

  async function handleRecordInput(e: CustomEvent<KeyboardInput | GamepadInput | undefined>) {
    const input = e?.detail
    
    if (selectedIdx === null) {
      // Create new step
      const newStep: RotationStep = {
        name: '',
        icon: '/images/skills/unknown.png',
        input
      }
      stepsStore.update(existingSteps => [...existingSteps, newStep])
      rotation.steps.push(newStep)
      rotation.updatedAt = new Date().toISOString()
      rotations.set(rots)
      selectedIdx = $stepsStore.length - 1
      await scrollToStep(selectedIdx)
    } else {
      // Update existing step
      stepsStore.update(existingSteps => {
        const newSteps = [...existingSteps]
        newSteps[selectedIdx!] = { ...newSteps[selectedIdx!], input }
        return newSteps
      })
      rotation.steps[selectedIdx].input = input
      rotation.updatedAt = new Date().toISOString()
      rotations.set(rots)
    }

    if (recordSingle) {
      // Stop recording after single input
      isRecording = false
      selectedIdx = null
      slotEditor?.reset()
      recordSingle = false
      return
    }
    
    // Move to next step
    const nextIdx = selectedIdx + 1
    if (nextIdx < $stepsStore.length) {
      selectedIdx = nextIdx
      await scrollToStep(selectedIdx)
      await tick()
      slotRecorder?.startRecording()
    } else {
      // No more steps, wait for new input to create next step
      selectedIdx = null
      await tick()
      slotRecorder?.startRecording()
    }
  }

  async function scrollToStep(idx: number) {
    await tick()
    const stepElement = document.querySelector(`[data-step-index="${idx}"]`)
    if (stepElement) {
      stepElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  async function duplicateRotation() {
    let name = prompt('Enter name for duplicated rotation', rotation.name + ' Copy') ?? ''
    if (!isValidRotationName(name)) {
      return
    }
    if (rots.some(r => r.name === name)) {
      alert('Name already in use')
      return
    }
    const newSlug = createSlug(name)
    const newRotation = { name, job: rotation.job, slug: newSlug, steps: $stepsStore, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastTwirlAt: undefined }
    rots.push(newRotation)
    rotations.set(rots)
    rotation = newRotation
    await goto(`/rotations/${newSlug}`, { invalidateAll: true })
  }

  async function deleteRotation() {
    const confirmDelete = confirm(`Are you sure you want to delete the rotation "${rotation.name}"? This action cannot be undone.`)
    if (!confirmDelete) {
      return
    }
    const index = rots.findIndex(r => r.slug === rotation.slug)
    if (index !== -1) {
      rots.splice(index, 1)
      rotations.set(rots)
    }
    await goto('/rotations', { invalidateAll: true })
  }
</script>

{#if loading}
  <div class="p-8 text-center text-slate-300 absolute top-0 bottom-0 left-0 right-0 bg-slate-900 z-10" aria-busy="true">
    Loading...
  </div>
{/if}

<Container>
  <PageTitle>
    <div class="flex items-center gap-3">
      <a href="/rotations" class="inline-flex items-center justify-center rounded hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50">
        <Icon src={LuChevronLeft} color="#57c5b7" size="1.5em" />
      </a>
      <div class="flex items-center gap-3">
        {#if jobIconUrl}
          <img src={jobIconUrl} alt={rotation?.job || 'Job'} class="h-12 w-12 shrink-0 rounded" />
        {:else}
          <div class="h-8 w-8 shrink-0 rounded bg-slate-700"></div>
        {/if}
        <span>{rotation?.name}</span>
      </div>
    </div>
  </PageTitle>
  <div class="flex justify-end mt-3">
    <Button
      variant="primary"
      onclick={goTwirl}
      class="{!canTwirl ? 'opacity-50' : ''}"
    >
      Twirl
    </Button>
    {#if !isRecording || recordSingle}
      <Button
        variant="outline-secondary"
        class="ml-3"
        onclick={startRecording}
      >
        Record Rotation
      </Button>
    {:else}
      <Button
        variant="outline-danger"
        class="ml-3"
        onclick={stopRecording}
      >
        Stop Recording
      </Button>
    {/if}
    <Button
      variant="outline-secondary"
      class="ml-3"
      onclick={duplicateRotation}
    >
      Duplicate
    </Button>
    <Button
      variant="outline-danger"
      class="ml-3 opacity-40 hover:opacity-100"
      onclick={deleteRotation}
    >
      Delete
    </Button>
  </div>
</Container>

<div class="grid gap-4 grid-cols-2">
  <div class="border border-slate-600 p-3 rounded-xl mb-8 bg-slate-900/40 container-job container-{rotation?.job}">
    <RotationStepList
      steps={$stepsStore}
      {selectedIdx}
      iconUrl={getIconUrl}
      on:reorder={(e) => handleReorder(e.detail)}
      on:selectstep={(e) => handleSelectStep(e.detail)}
      on:recordstep={(e) => handleRecordStep(e.detail)}
      on:deletestep={(e) => handleDeleteStep(e.detail)}
    />
    <div class="pt-3 mt-3">
      <Button variant="outline-primary" class="block w-full {canTwirl ? '' : 'opacity-50'}" onclick={goTwirl}>Start Twirling</Button>
    </div>
  </div>
  <Container class="sticky top-20 self-start">
    {#if isRecording}
      <SlotRecorder
        once={recordSingle}
        showClear={recordSingle}
        bind:this={slotRecorder}
        on:input={handleRecordInput}
        on:cancel={stopRecording}
      />
    {:else}
      <SlotEditor
        on:newentry={(e) => newEntry(e.detail.step, e.detail.propagateKeybind)}
        on:updateentry={(e) => updateEntry(e.detail.idx, e.detail.step, e.detail.propagateKeybind)}
        on:deletestep={(e) => handleDeleteStep(e.detail)}
        bind:this={slotEditor}
        jobIcon={jobIconUrl}
        suggestions={jobActions}
        existingSteps={$stepsStore}
      />
    {/if}
  </Container>

</div>
