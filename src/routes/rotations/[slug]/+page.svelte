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
  import { CgMouse } from 'svelte-icons-pack/cg'
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

  $: jobIconUrl = rotation?.job ? iconUrl(`jobs/${rotation.job}.png`) : ''
  $: filteredActions = (actionFilter?.trim()?.length ? jobActions.filter(a => a.name?.toLowerCase().includes(actionFilter.trim().toLowerCase())) : jobActions)

  onMount(async () => {
    try {
      const rot = rots.find(r => r.slug === $page.params?.slug)
      if (rot === undefined) {
        await goto('/rotations')
        return
      }
      rotation = rot
      // const foo = await fetch('/api/actions/' + rotation.job)
      const foo = await import('$lib/assets/xiv/jobs/drg.json')
      jobActions = foo.default
      stepsStore.set(rotation.steps as RotationStep[])
    } finally {
      loading = false
    }
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

  function pickAction(action: any) {
    if (!rotation) return
    rotation.steps = rotation.steps || []
    rotation.steps.push({ name: action.name })
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

  <div class="col-span-2 sticky bottom-0 z-20 bg-slate-900/90 backdrop-blur border-t border-slate-700">
    <div class="max-w-7xl mx-auto px-4 py-3">
      <div class="flex items-center gap-3 mb-3">
        <input
          bind:value={actionFilter}
          type="text"
          placeholder="Filter actions…"
          class="w-full sm:w-80 rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <div class="text-xs text-slate-400 hidden sm:block">{filteredActions.length} of {jobActions.length}</div>
      </div>

      <div class="max-h-64 overflow-y-auto pr-1">
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-2">
          {#each filteredActions as action (action.icon)}
            <button
              type="button"
              class="group flex items-center gap-2 rounded border border-slate-700 bg-slate-800/60 hover:bg-slate-700/60 focus:outline-none focus:ring-2 focus:ring-primary/40 px-2 py-2 text-left"
              title={action.name}
              on:click={() => pickAction(action)}
            >
              <img src={iconUrl(action.icon)} alt={action.name} class="h-8 w-8 shrink-0 rounded" />
              <span class="truncate text-sm">{action.name}</span>
            </button>
          {/each}
        </div>
      </div>
    </div>
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
