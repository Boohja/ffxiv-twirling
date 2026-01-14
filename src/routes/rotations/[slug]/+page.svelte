<script lang="ts">
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { flip } from 'svelte/animate'
  import { slide } from 'svelte/transition'
  import { rotations, type Rotation, type RotationStep, type RotationStepKey } from '$lib/stores'
  import { get, writable } from 'svelte/store'
	import EmptySlot from "$lib/components/twirling/EmptySlot.svelte";
import { onMount } from 'svelte'
  import PageTitle from '$lib/components/page/PageTitle.svelte'
  import { Icon } from 'svelte-icons-pack'
  import { CgMouse, CgTrash } from 'svelte-icons-pack/cg'
  import { BiX } from 'svelte-icons-pack/bi'
  import { BiChevronLeft } from 'svelte-icons-pack/bi'
  import {formatKeybind, hasKeybind} from "$lib/helpers.js"

  const rots = get(rotations)
  let rotation: Rotation
  let jobActions: any[] = []
  let slotEditor: EmptySlot
  const stepsStore = writable([] as RotationStep[])
  $: steps = $stepsStore
  let loading = true
  let actionFilter = ''

  // Map all action icons to URLs for dynamic usage in the template
  const iconModules = import.meta.glob('/src/lib/assets/xiv/**/*.png', { eager: true, as: 'url' }) as Record<string, string>
  const iconUrl = (iconPath: string): string => {
    const key = '/src/lib/assets/xiv/' + iconPath.replace(/^\/+/, '')
    return iconModules[key] ?? ''
  }

  // Lazily load job JSON files using alias; map by basename so keys don't depend on '/src'
  const jobJsonModules = import.meta.glob('$lib/assets/xiv/jobs/*.json') as Record<string, () => Promise<{ default: any }>>
  const jobLoaderById: Record<string, () => Promise<{ default: any }>> = Object.fromEntries(
    Object.entries(jobJsonModules).map(([path, loader]) => {
      const file = path.split('/').pop() || ''
      const id = file.replace(/\.json$/i, '')
      return [id, loader]
    })
  )
  const loadJobActions = async (job: string): Promise<any[]> => {
    const loader = jobLoaderById[job]
    if (!loader) return []
    const mod = await loader()
    return mod?.default ?? []
  }

  $: jobIconUrl = rotation?.job ? iconUrl(`jobs/${rotation.job}.png`) : ''

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

  // Removed moveStep functionality (drag & drop handles reordering now)

  // Drag & Drop state
  let draggingIndex: number | null = null
  // dropIndex represents the position BETWEEN items where the dragged item would be inserted (0..steps.length)
  let dropIndex: number | null = null
  let selectedIdx: number | null = null

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

  function handleDragStart (e: DragEvent, index: number) {
    draggingIndex = index
    // Initialize drop position to current index so a bar shows up where it will re-insert
    dropIndex = index
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', String(index))
      e.dataTransfer.effectAllowed = 'move'
    }
  }

  function handleDragOver (e: DragEvent, index: number) {
    // index here is the target step index to insert BEFORE
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    dropIndex = index
  }

  function handleDragOverAfter (e: DragEvent, index: number) {
    // index here is the target step index to insert AFTER
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    dropIndex = index + 1
  }

  function handleDrop (e: DragEvent) {
    e.preventDefault()
    const fromStr = e.dataTransfer?.getData('text/plain') ?? ''
    const from = fromStr ? parseInt(fromStr, 10) : draggingIndex
    if (from == null || Number.isNaN(from) || dropIndex == null) {
      handleDragEnd()
      return
    }
    // Compute target insertion index based on dropIndex (position between items)
    let to = dropIndex
    if (from < to) to = to - 1
    if (to === from) {
      handleDragEnd()
      return
    }

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
      const f = from
      const t = to
      if (selectedIdx === f) {
        selectedIdx = t
      } else if (f < t) {
        // Items between f+1..t shift up by 1
        if (selectedIdx > f && selectedIdx <= t) selectedIdx = selectedIdx - 1
      } else if (f > t) {
        // Items between t..f-1 shift down by 1
        if (selectedIdx >= t && selectedIdx < f) selectedIdx = selectedIdx + 1
      }
    }
    rotation.steps = updated
    rotations.set(rots)
    handleDragEnd()
  }

  function handleDragEnd () {
    draggingIndex = null
    dropIndex = null
  }

  $: canTwirl = $stepsStore.every(step => hasKeybind(step.key)) && $stepsStore.length > 0

  function newEntry (entry: RotationStep, propagateKeybind: boolean) {
    const newStep = {
      name: entry.name,
      icon: entry.icon,
      key: entry.key,
      action: (entry as any).action
    }
    stepsStore.update(existingSteps => [...existingSteps, newStep])
    rotation.steps.push(newStep)
    // console.log('new entry steps: ', steps)
    // console.log('new entry rotation: ', rotation)
    // rotation.steps = steps
    rotations.set(rots)
    if (propagateKeybind && entry.key) {
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
    if (propagateKeybind && entry.key) {
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

  function pickAction(action: any) {
    if (!rotation) return
    rotation.steps = rotation.steps || []
    // Store relative icon so it can be resolved at runtime
    rotation.steps.push({ name: action.name, icon: action.icon, action: action.row_id })
    rotations.set(rots)
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
          <div class="h-8 w-8 shrink-0 rounded bg-slate-700" />
        {/if}
        <span>{rotation?.name}</span>
      </div>
    </div>
  </PageTitle>
</div>

<div class="grid gap-4 grid-cols-2">
  <div class="border border-slate-500 p-3 mb-5">
    <div class="pr-1">
      {#each $stepsStore as step, idx (step)}
        <div animate:flip={{ duration: 200 }}>
          <!-- Pre-step drop zone -->
          <div
            class="drop-zone {dropIndex === idx ? 'active' : ''}"
            on:dragover={(e) => handleDragOver(e, idx)}
            on:drop={handleDrop}
          />
          <div
            class="step border rounded border-slate-600 mb-2 relative grid hover:bg-slate-700 cursor-grab active:cursor-grabbing {selectedIdx === idx ? 'border-teal-500 ring-1 ring-teal-400/40 bg-slate-700/50' : ''}"
            class:dragging={draggingIndex === idx}
            draggable={true}
            on:dragstart={(e) => handleDragStart(e, idx)}
            on:dragover={(e) => handleDragOverAfter(e, idx)}
            on:drop={handleDrop}
            on:dragend={handleDragEnd}
          >
          <div class="px-2 py-3 text-right tabular-nums text-slate-400 select-none self-center">
            {idx + 1}
          </div>
          <div class="align-middle self-center" on:click={() => selectStep(idx, step)} on:keypress={() => selectStep(idx, step)}>
            <img src={step.icon?.startsWith('actions/') ? iconUrl(step.icon) : step.icon} class="w-14 h-14 object-contain" alt="" />
          </div>
          <div class="p-3 self-center" on:click={() => selectStep(idx, step)} on:keypress={() => selectStep(idx, step)}>
            <div class="font-medium leading-tight">{step.name}</div>
            <div class="mt-1 flex items-center gap-2">
              <span class="font-thin text-xs bg-opacity-40 {hasKeybind(step.key) ? 'bg-black' : 'bg-yellow-400' } px-2 py-1 inline-flex items-center gap-1 rounded-full">
                <Icon src={CgMouse} className="inline" /> {formatKeybind(step.key)}
              </span>
            </div>
          </div>
          <button
            class="delete-btn hover:bg-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            aria-label="Delete step {step.name}"
            title="Delete step"
            on:click={() => {
              stepsStore.update(existingSteps => existingSteps.filter((_, i) => i !== idx))
              rotation.steps = $stepsStore
              rotations.set(rots)
            }}
          >
            <Icon src={BiX} size="1.1em" />
          </button>
          </div>
        </div>
      {/each}
      <!-- Final drop zone at end -->
      <div
        class="drop-zone end {dropIndex === $stepsStore.length ? 'active' : ''}"
        on:dragover={(e) => handleDragOver(e, $stepsStore.length)}
        on:drop={handleDrop}
      />
    </div>
    <div class="pt-3 mt-3 border-t border-slate-700">
      <button class="py-3 w-full px-5 border border-teal-700 hover:bg-teal-700 {canTwirl ? '' : 'opacity-40'} rounded-full text-white font-semibold" on:click={goTwirl}>Twirl</button>
    </div>
  </div>
  <div class="p-4 border border-slate-900/60 rounded mb-8 bg-slate-900/40 sticky top-4 self-start">
    <EmptySlot
      on:newentry={(e) => newEntry(e.detail.step, e.detail.propagateKeybind)}
      on:updateentry={(e) => updateEntry(e.detail.idx, e.detail.step, e.detail.propagateKeybind)}
      bind:this={slotEditor}
      suggestions={jobActions}
      existingSteps={$stepsStore}
    />
  </div>

</div>


<style>
  /* Your existing styles */

  /* Apply a CSS transition to the steps */
  .step {
    /* Adjusted columns: index | icon | info | delete */
    grid-template-columns: 2.25rem max-content auto 3rem;
    align-items: stretch;
  }
  .step.dragging {
    opacity: 0.6;
  }
  /* Full-height drop zones before each step and at end */
  .drop-zone {
    position: relative;
    height: 0.5rem; /* collapsed until active */
    margin: 0.25rem 0;
    border-radius: 4px;
    transition: all 80ms ease;
    background: transparent;
    outline: 2px dashed transparent;
  }
  .drop-zone.active {
    height: 3.5rem; /* approximate step height for easier targeting */
    background: rgba(45,212,191,0.08);
    outline-color: rgba(45,212,191,0.6);
    box-shadow: 0 0 0 1px rgba(45,212,191,0.45), 0 0 12px rgba(45,212,191,0.25) inset;
  }
  .drop-zone.end { margin-top: 0.75rem; }
  .delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    font-size: 1.25rem;
  }
</style>
