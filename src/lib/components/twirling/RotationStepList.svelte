<script lang="ts">
  import { flip } from 'svelte/animate'
  import { getStepName } from '$lib/helpers.js'
  import { Icon } from 'svelte-icons-pack'
  import { RiEditorDraggable } from 'svelte-icons-pack/ri'
  import type { RotationStep } from '$lib/stores'
  import type { ActionLanguage, JobAction } from '$lib/types/jobActions'
  import { createEventDispatcher } from 'svelte'
  import InputRender from './InputRender.svelte'

  export let steps: RotationStep[] = []
  export let selectedIdx: number | null = null
  export let iconUrl: (path: string) => string
  export let readonly: boolean = false
  export let jobActions: JobAction[] = []
  export let language: ActionLanguage = 'en'

  const dispatch = createEventDispatcher()

  // Internal drag & drop state
  let draggingIndex: number | null = null
  let dropIndex: number | null = null
  let hoveredIndex: number | null = null

  function handleDragStart(e: DragEvent, index: number) {
    if (readonly) {
      e.preventDefault()
      return
    }
    draggingIndex = index
    dropIndex = index
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', String(index))
      e.dataTransfer.effectAllowed = 'move'
    }
  }

  function handleDragOver(e: DragEvent, index: number) {
    e.preventDefault()
    if (readonly) {
      return
    }
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    dropIndex = index
  }

  function handleDragOverAfter(e: DragEvent, index: number) {
    e.preventDefault()
    if (readonly) {
      return
    }
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    dropIndex = index + 1
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    if (readonly) {
      return
    }
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
        class="step border-b border-slate-700 relative grid hover2:bg-slate-700/20 {selectedIdx === idx ? 'bg-teal-700/20 active' : ''}"
        class:dragging={draggingIndex === idx}
        role="listitem"
        data-step-index={idx}
        on:dragover={(e) => handleDragOverAfter(e, idx)}
        on:drop={handleDrop}
        on:mouseenter={() => (hoveredIndex = idx)}
        on:mouseleave={() => (hoveredIndex = null)}
      >
        <!-- Drag Index -->
        <div
          class="px-2 py-2 text-right tabular-nums select-none self-center relative {readonly ? 'text-slate-400' : 'grab-handle-container'}"
          draggable={!readonly}
          role="button"
          tabindex="0"
          on:dragstart={(e) => handleDragStart(e, idx)}
          on:dragend={handleDragEnd}
        >
          {#if hoveredIndex === idx && !readonly}
            <div class="grab-handle cursor-grab active:cursor-grabbing text-slate-400">
              <Icon src={RiEditorDraggable} size="20" />
            </div>
          {:else}
            <span class="text-slate-400">{idx + 1}</span>
          {/if}
        </div>
        <!-- Step Action -->
        <div class="step-action m-1 rounded-md pl-1">
          <div
            class="align-middle self-center py-1 px-1"
            role="button"
            tabindex="0"
            on:click={() => dispatch('selectstep', { idx, step })}
            on:keypress={() => dispatch('selectstep', { idx, step })}
          >
            <img src={step.icon?.startsWith('actions/') ? iconUrl(step.icon) : step.icon} class="{readonly ? 'w-8 h-8' : 'w-12 h-12'} object-contain" alt="" />
          </div>
          <div class="px-3 self-center {readonly ? 'py-2' : 'py-4'}"
            on:click={() => dispatch('selectstep', { idx, step })}
            on:keypress={() => dispatch('selectstep', { idx, step })}
            role="button"
            tabindex="0"
          >
            <div class="font-medium leading-tight">{getStepName(jobActions, step, language)}</div>
          </div>
        </div>
        {#if !readonly}
          <div class="step-keybind self-center flex p-1 border-l border-slate-700/20">
            <button
              class="flex-1 rounded-lg px-3 py-2 border border-transparent min-h-[2.5rem] flex items-center cursor-pointer h-14 min-w-40 place-content-center"
              title="Set Keybind"
              on:click={() => dispatch('recordstep', { idx, step })}
              on:keypress={() => dispatch('recordstep', { idx, step })}
            >
              <InputRender input={step.input} mode="pretty" size="sm" showPlus={false} />
            </button>
          </div>
        {/if}
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
    grid-template-columns: 2rem 1fr 12rem;
    align-items: stretch;
  }
  .step-action {
    display: grid;
    grid-template-columns: max-content 1fr;
    align-items: stretch;
  }
  .step-action:hover {
    cursor: pointer;
  }
  .step-keybind {
    min-width: 6rem;
    text-align: center;
    font-family: 'Fira Code', monospace, monospace;
    font-size: 0.875rem;
    color: #81e6d9;
  }
  .step.dragging {
    opacity: 0.6;
  }
  .drop-zone {
    position: relative;
    height: 0;
    margin: 0;
    border-radius: 4px;
    transition: all 80ms ease;
    background: transparent;
    outline: 2px dashed transparent;
  }
  .grab-handle-container {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .grab-handle {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .drop-zone.active {
    height: 3rem;
    background: rgba(45,212,191,0.08);
    outline-color: rgba(45,212,191,0.6);
    box-shadow: 0 0 0 1px rgba(45,212,191,0.45), 0 0 12px rgba(45,212,191,0.25) inset;
  }
  .drop-zone.end { margin-top: 0.5rem; }
</style>
