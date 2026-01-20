<script lang="ts">
  import { flip } from 'svelte/animate'
  import { formatKeybind, hasKeybind } from '$lib/helpers.js'
  import { Icon } from 'svelte-icons-pack'
  import { CgMouse } from 'svelte-icons-pack/cg'
  import { BiX } from 'svelte-icons-pack/bi'
  import type { RotationStep } from '$lib/stores'
  import { createEventDispatcher } from 'svelte'

  export let steps: RotationStep[] = []
  export let selectedIdx: number | null = null
  export let iconUrl: (path: string) => string

  const dispatch = createEventDispatcher()

  // Internal drag & drop state
  let draggingIndex: number | null = null
  let dropIndex: number | null = null

  function handleDragStart(e: DragEvent, index: number) {
    draggingIndex = index
    dropIndex = index
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', String(index))
      e.dataTransfer.effectAllowed = 'move'
    }
  }

  function handleDragOver(e: DragEvent, index: number) {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    dropIndex = index
  }

  function handleDragOverAfter(e: DragEvent, index: number) {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    dropIndex = index + 1
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    const fromStr = e.dataTransfer?.getData('text/plain') ?? ''
    const from = fromStr ? parseInt(fromStr, 10) : draggingIndex
    
    if (from == null || Number.isNaN(from) || dropIndex == null) {
      handleDragEnd()
      return
    }

    let to = dropIndex
    if (from < to) to = to - 1
    
    if (to !== from) {
      // Emit reorder event with from/to indices
      dispatch('reorder', { from, to })
    }
    
    handleDragEnd()
  }

  function handleDragEnd() {
    draggingIndex = null
    dropIndex = null
  }
</script>

<div class="pr-1">
  {#each steps as step, idx (step)}
    <div animate:flip={{ duration: 200 }}>
      <!-- Pre-step drop zone -->
      <div
        class="drop-zone {dropIndex === idx ? 'active' : ''}"
        role="region"
        on:dragover={(e) => handleDragOver(e, idx)}
        on:drop={handleDrop}
      ></div>
      <div
        class="step border rounded border-slate-600 mb-2 relative grid hover:bg-slate-700 cursor-grab active:cursor-grabbing {selectedIdx === idx ? 'border-teal-500 ring-1 ring-teal-400/40 bg-slate-700/50' : ''}"
        class:dragging={draggingIndex === idx}
        draggable={true}
        role="listitem"
        on:dragstart={(e) => handleDragStart(e, idx)}
        on:dragover={(e) => handleDragOverAfter(e, idx)}
        on:drop={handleDrop}
        on:dragend={handleDragEnd}
      >
        <div class="px-2 py-3 text-right tabular-nums text-slate-400 select-none self-center">
          {idx + 1}
        </div>
        <div
          class="align-middle self-center"
          role="button"
          tabindex="0"
          on:click={() => dispatch('selectstep', { idx, step })}
          on:keypress={() => dispatch('selectstep', { idx, step })}
        >
          <img src={step.icon?.startsWith('actions/') ? iconUrl(step.icon) : step.icon} class="w-14 h-14 object-contain" alt="" />
        </div>
        <div class="p-3 self-center"
          on:click={() => dispatch('selectstep', { idx, step })}
          on:keypress={() => dispatch('selectstep', { idx, step })}
          role="button"
          tabindex="0"
        >
          <div class="font-medium leading-tight">{step.name}</div>
          <div class="mt-1 flex items-center gap-2">
            <span class="font-thin text-xs bg-opacity-40 {hasKeybind(step.input) ? 'bg-black' : 'bg-yellow-400' } px-2 py-1 inline-flex items-center gap-1 rounded-full">
              <Icon src={CgMouse} className="inline" /> {formatKeybind(step.input)}
            </span>
          </div>
        </div>
        <button
          class="delete-btn hover:bg-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          aria-label="Delete step {step.name}"
          title="Delete step"
          on:click={() => dispatch('deletestep', { idx })}
        >
          <Icon src={BiX} size="1.1em" />
        </button>
      </div>
    </div>
  {/each}
  <!-- Final drop zone at end -->
  <div
    class="drop-zone end {dropIndex === steps.length ? 'active' : ''}"
    role="region"
    on:dragover={(e) => handleDragOver(e, steps.length)}
    on:drop={handleDrop}
  ></div>
</div>

<style>
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
