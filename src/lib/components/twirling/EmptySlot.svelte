<script lang="ts">
  import { Icon } from 'svelte-icons-pack';
  import { createEventDispatcher } from 'svelte';
  // Each suggestion can include XIV icon path and optional row_id
  type ActionSuggestion = {
    name: string
    icon: string // e.g. "actions/123.png"
    row_id?: number
  }
  import InputModal from "$lib/components/twirling/InputModal.svelte";
  import { CgMouse } from "svelte-icons-pack/cg";
  import {formatKeybind, hasKeybind} from "$lib/helpers";
  import type {RotationStep, RotationStepKey} from '$lib/stores'

  let opened = false
  let propagateKeybind = true
  let refInputModal: any
  let stepIdx = -1
  let inputValue = ''
  let keybindValue: RotationStepKey | undefined
  const defaultImage = '/images/skills/unknown.png'
  const defaultImages = [
    '/images/skills/cogs.png',
    '/images/skills/exclamation.png',
    '/images/skills/mouse.png',
    '/images/skills/unknown.png',
    '/images/skills/blue_0.png',
    '/images/skills/blue_1.png',
    '/images/skills/blue_2.png',
    '/images/skills/blue_3.png',
    '/images/skills/blue_4.png',
    '/images/skills/blue_5.png',
    '/images/skills/blue_6.png',
    '/images/skills/blue_7.png',
    '/images/skills/blue_8.png',
    '/images/skills/blue_9.png',
    '/images/skills/blue_10.png',
    '/images/skills/yellow_0.png',
    '/images/skills/yellow_1.png',
    '/images/skills/yellow_2.png',
    '/images/skills/yellow_3.png',
    '/images/skills/yellow_4.png',
    '/images/skills/yellow_5.png',
    '/images/skills/yellow_6.png',
    '/images/skills/yellow_7.png',
    '/images/skills/yellow_8.png',
    '/images/skills/yellow_9.png',
    '/images/skills/yellow_10.png'
  ]
  let imgSrc = '/images/skills/unknown.png'
  export let suggestions: ActionSuggestion[]
  export let existingSteps: RotationStep[] = []
  const dispatch = createEventDispatcher();

  // Action icon resolver for XIV assets
  const iconModules = import.meta.glob('/src/lib/assets/xiv/**/*.png', { eager: true, as: 'url' }) as Record<string, string>
  const iconUrl = (iconPath: string): string => {
    const key = '/src/lib/assets/xiv/' + iconPath.replace(/^\/+/, '')
    return iconModules[key] ?? ''
  }

  // Mode: choose between XIV Action vs Custom step
  let mode: 'action' | 'custom' = 'action'
  let actionFilter = ''
  let selectedAction: ActionSuggestion | null = null
  $: filteredActions = (actionFilter?.trim()?.length ? suggestions.filter(a => a.name?.toLowerCase().includes(actionFilter.trim().toLowerCase())) : suggestions)

  function setMode(newMode: 'action' | 'custom') {
    mode = newMode
    // Reset state when switching tabs
    selectedAction = null
    actionFilter = ''
    inputValue = ''
    imgSrc = defaultImage
  }

  async function toggleMenu () {
    opened = !opened
  }

  // Validation
  $: customName = inputValue.trim()
  $: isNameCollision = mode === 'custom' && !!customName && suggestions.some(s => s.name.toLowerCase() === customName.toLowerCase())
  $: canSubmit = mode === 'action'
    ? !!selectedAction
    : (customName.length > 0 && !isNameCollision)

  function checkKey (e: KeyboardEvent) {
    // Enter submits when valid
    if (e.key === 'Enter' && canSubmit) {
      submit()
    }
  }

  function showInputModal () {
    refInputModal.show()
  }

  export function editStep (idx: number, step: RotationStep) {
    stepIdx = idx
    keybindValue = step.key
    // Infer mode from icon: XIV actions are stored as relative 'actions/...'
    if (step.icon?.startsWith('actions/')) {
      mode = 'action'
      selectedAction = {
        name: step.name,
        icon: step.icon,
        row_id: step.action
      }
      imgSrc = iconUrl(step.icon)
      actionFilter = ''
    } else {
      mode = 'custom'
      selectedAction = null
      imgSrc = step.icon || defaultImage
    }
    inputValue = step.name
  }

  function submit () {
    if (!canSubmit) {
      return
    }
    const step: RotationStep = mode === 'action' && selectedAction
      ? {
          name: selectedAction.name,
          // Store relative XIV icon path; consumers can resolve via iconUrl
          icon: selectedAction.icon,
          action: selectedAction.row_id,
          key: keybindValue
        }
      : {
          name: customName,
          icon: imgSrc,
          key: keybindValue
        }

    if (stepIdx > -1) {
      dispatch('updateentry', { idx: stepIdx, step, propagateKeybind })
    } else {
      dispatch('newentry', { step, propagateKeybind })
    }
    cancel()
  }

  function cancel () {
    inputValue = ''
    imgSrc = defaultImage
    keybindValue = undefined
    stepIdx = -1
    mode = 'action'
    selectedAction = null
    actionFilter = ''
  }

  // Allow parent to clear/reset the editor state
  export function reset () {
    cancel()
  }

  function selectAction(a: ActionSuggestion) {
    selectedAction = a
    imgSrc = iconUrl(a.icon)
    inputValue = a.name
    // Auto-assign keybind if propagate is on and an existing step has a keybind
    maybeAdoptExistingKeybind()
  }

  function maybeAdoptExistingKeybind () {
    if (mode !== 'action' || !selectedAction) return
    // Only auto-fill for new entries and when propagate is checked
    if (stepIdx !== -1 || !propagateKeybind) return
    // Do not override an explicit keybind already set
    if (keybindValue && hasKeybind(keybindValue)) return
    const name = selectedAction.name
    const match = existingSteps.find(s => s.name === name && s.key && hasKeybind(s.key))
    if (match?.key) {
      keybindValue = match.key
    }
  }

  // If user toggles propagate on after selecting an action, try adopting again
  $: if (propagateKeybind && mode === 'action' && selectedAction && stepIdx === -1 && !(keybindValue && hasKeybind(keybindValue))) {
    maybeAdoptExistingKeybind()
  }
</script>

<style>
</style>

<div class="flex gap-4">
  <!-- Preview -->
  <div class="flex-none">
    <img src={imgSrc} alt="Preview" class="w-16 h-16 border border-slate-500 rounded-lg object-cover" />
  </div>

  <div class="flex-1 min-w-0">
    <!-- Mode toggle -->
    <div class="inline-flex rounded-full overflow-hidden border border-slate-600">
      <button type="button" class="px-3 py-1 text-sm {mode === 'action' ? 'bg-primary/50' : 'bg-slate-800'}" on:click={() => setMode('action')}>
        Job action
      </button>
      <button type="button" class="px-3 py-1 text-sm {mode === 'custom' ? 'bg-primary/50' : 'bg-slate-800'}" on:click={() => setMode('custom')}>
        Custom step
      </button>
    </div>

    {#if mode === 'action'}
      <!-- Action picker -->
      <div class="mt-3">
        <label class="block text-sm mb-1">
          Search actions
          <input
            bind:value={actionFilter}
            type="text"
            placeholder="Filter actions…"
            class="w-full mt-1 rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            on:keyup={checkKey}
          />
        </label>
        <div class="text-xs text-slate-400 mt-1">{filteredActions.length} of {suggestions.length}</div>
      </div>

      <div class="mt-3 max-h-56 overflow-y-auto pr-1">
        <div class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
          {#each filteredActions as action (action.icon)}
            <button
              type="button"
              class="group flex items-center gap-2 rounded border {selectedAction?.icon === action.icon ? 'border-teal-500 bg-slate-700' : 'border-slate-700 bg-slate-800/60'} hover:bg-slate-700/60 focus:outline-none focus:ring-2 focus:ring-primary/40 px-2 py-2 text-left"
              title={action.name}
              on:click={() => selectAction(action)}
            >
              <img src={iconUrl(action.icon)} alt={action.name} class="h-8 w-8 shrink-0 rounded" />
              <span class="truncate text-sm">{action.name}</span>
            </button>
          {/each}
        </div>
      </div>
    {:else}
      <!-- Custom step form -->
      <div class="mt-3">
        <label class="block text-sm mb-1">
          Name
          <input
            bind:value={inputValue}
            on:keyup={checkKey}
            class="w-full mt-1 rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="e.g. Switching hotbars"
          />
        </label>
        {#if isNameCollision}
          <div class="text-xs text-red-300 mt-1">This matches a job action name. Please choose a different name.</div>
        {/if}
      </div>
      <fieldset class="mt-3">
        <legend class="block text-sm mb-1">Icon</legend>
        <div class="flex flex-wrap gap-2">
          {#each defaultImages as di}
            <button
              type="button"
              class="p-0 border {imgSrc === di ? 'border-teal-500' : 'border-slate-700'} rounded"
              on:click={() => { imgSrc = di }}
              aria-pressed={imgSrc === di}
            >
              <img src={di} alt="" class="w-12 h-12 rounded object-cover" />
            </button>
          {/each}
        </div>
      </fieldset>
    {/if}

    <div class="mt-4">
      <span id="keybind-label" class="block text-sm mb-1">Keybind</span>
        <div class="mt-1 flex items-center gap-2">
          <button type="button" class="font-thin bg-opacity-20 bg-black px-3 py-2 inline-flex items-center gap-2 rounded-full" aria-labelledby="keybind-label" on:click={showInputModal}>
            <Icon src={CgMouse} className="inline" /> <span>{formatKeybind(keybindValue)}</span>
          </button>
          {#if hasKeybind(keybindValue)}
            <button
              type="button"
              class="text-xs inline-flex items-center gap-1 rounded-full border border-slate-600 px-2 py-1 text-slate-200 hover:bg-slate-800"
              title="Clear keybind"
              on:click={() => (keybindValue = undefined)}
            >
              ✘ Clear
            </button>
          {/if}
        </div>
      <div class="mt-2">
        <label class="text-sm">
          <input type="checkbox" class="mr-2 align-middle" bind:checked={propagateKeybind} /> Apply keybind to steps with same name
        </label>
      </div>
    </div>
  </div>

  <InputModal bind:this={refInputModal} on:keybind={(e) => keybindValue = e.detail} />
</div>

<div class="mt-5 flex gap-2">
  <button class="py-3 px-5 bg-teal-700 {canSubmit ? '' : 'opacity-40 cursor-not-allowed'} rounded-full text-white font-semibold" on:click={submit} disabled={!canSubmit}>{stepIdx > -1 ? 'Save' : 'Create'}</button>
  {#if stepIdx > -1}
    <button class="py-3 px-5 border border-gray-500 rounded-full text-white font-semibold" on:click={cancel}>Cancel</button>
  {/if}
</div>


<!--  <Icon src={CgAddR} size="2em" />-->
