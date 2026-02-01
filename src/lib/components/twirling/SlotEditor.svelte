<script lang="ts">
  import { Icon } from 'svelte-icons-pack';
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import InputModal from "$lib/components/twirling/InputModal.svelte";
  import { FiTrash2 } from "svelte-icons-pack/fi";
  import { getAction, getActionName, hasKeybind} from "$lib/helpers";
  import type {RotationStep, KeyboardInput, GamepadInput} from '$lib/stores'

  let propagateKeybind = true
  let refInputModal: any
  let stepIdx = -1
  let nameInputValue = ''
  let bindingValue: KeyboardInput | GamepadInput | undefined
  let recording = false
  const defaultImage = ''
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
  import { getIconUrl } from '$lib/iconLoader'
	import { LuInfo } from 'svelte-icons-pack/lu';
	import SlotRecorder from './SlotRecorder.svelte';
	import InputRender from './InputRender.svelte';
	import type { ActionLanguage, JobAction } from '$lib/types/jobActions';

  let imgSrc = ''
  export let suggestions: JobAction[]
  export let existingSteps: RotationStep[] = []
  export let jobIcon: string = ''
  export let language: ActionLanguage = 'en';
  
  const dispatch = createEventDispatcher();

  let refRecorder: SlotRecorder;
  let mode: 'action' | 'custom' = 'action'
  let actionFilter = ''
  let actionFilterRef: HTMLInputElement;
  let selectedAction: JobAction | null = null
  $: filteredActions = (actionFilter?.trim()?.length ? suggestions.filter(a => a.name[language]?.toLowerCase().includes(actionFilter.trim().toLowerCase())) : suggestions)

  onMount(() => {
    tick().then(() => {
      actionFilterRef?.focus()
    })
  })

  function setMode(newMode: 'action' | 'custom') {
    mode = newMode
    selectedAction = null
    actionFilter = ''
    nameInputValue = ''
    imgSrc = ''
  }

  // Validation
  $: customName = nameInputValue.trim()
  $: canSubmit = mode === 'action' ? !!selectedAction : customName.length > 0

  function checkKey (e: KeyboardEvent) {
    // Enter submits when valid
    if (e.key === 'Enter' && canSubmit) {
      submit()
    }
  }

  async function startInputRecorder() {
    recording = true
    await tick();
    refRecorder?.startRecording()
  }

  function handleRecorderInput(e: CustomEvent<KeyboardInput | GamepadInput | undefined>) {
    bindingValue = e?.detail
    recording = false
  }

  function handleRecorderCancel() {
    recording = false
  }

  export function editStep (idx: number, step: RotationStep) {
    stepIdx = idx
    bindingValue = step.input
    // Infer mode from icon: XIV actions are stored as relative 'actions/...'
    if (step.icon?.startsWith('actions/')) {
      mode = 'action'
      selectedAction = getAction(suggestions, step.action!)!
      imgSrc = getIconUrl(step.icon)
      actionFilter = ''
    } else {
      mode = 'custom'
      selectedAction = null
      imgSrc = step.icon || defaultImage
      nameInputValue = step.name!
    }
  }

  function submit () {
    if (!canSubmit) {
      return
    }
    const step: RotationStep = mode === 'action' && selectedAction
      ? {
          icon: selectedAction.icon,
          action: selectedAction.id,
          input: bindingValue
        }
      : {
          name: customName,
          icon: imgSrc,
          input: bindingValue
        }

    if (stepIdx > -1) {
      dispatch('updateentry', { idx: stepIdx, step, propagateKeybind })
    } else {
      dispatch('newentry', { step, propagateKeybind })
      mode === 'action' ? actionFilterRef.focus() : nameInputValue = ''
    }
    cancel()
  }

  function cancel () {
    nameInputValue = ''
    imgSrc = defaultImage
    bindingValue = undefined
    stepIdx = -1
    mode = 'action'
    selectedAction = null
    actionFilter = ''
  }

  // Allow parent to clear/reset the editor state
  export function reset () {
    cancel()
  }

  function selectAction(a: JobAction) {
    selectedAction = a
    imgSrc = getIconUrl(a.icon)
    nameInputValue = getActionName(suggestions, a.id, language)
    // Auto-assign keybind if propagate is on and an existing step has a keybind
    maybeAdoptExistingKeybind()
  }

  function maybeAdoptExistingKeybind () {
    if (mode !== 'action' || !selectedAction) return
    // Only auto-fill for new entries and when propagate is checked
    if (stepIdx !== -1 || !propagateKeybind) return
    // Do not override an explicit input already set
    if (bindingValue && hasKeybind(bindingValue)) return
    const name = selectedAction.name
    const match = existingSteps.find(s => s.action && s.action === selectedAction?.id && s.input && hasKeybind(s.input))
    if (match?.input) {
      bindingValue = match.input
    }
  }

  // If user toggles propagate on after selecting an action, try adopting again
  $: if (propagateKeybind && mode === 'action' && selectedAction && stepIdx === -1 && !(bindingValue && hasKeybind(bindingValue))) {
    maybeAdoptExistingKeybind()
  }
</script>

<div class="flex flex-col">
  <!-- Header with preview icon -->
  <div class="flex items-start gap-3 mb-4">
    <div class="flex-none">
      <div class="relative group cursor-pointer">
        {#if imgSrc}
          <img 
            src={imgSrc} 
            alt="Preview" 
            class="w-16 h-16 border-2 border-slate-600 rounded-lg object-cover transition-all group-hover:border-primary/50" 
          />
        {:else}
          <div class="w-16 h-16 border-2 italic border-teal-600 border-dashed rounded-lg bg-slate-900/70 flex items-center justify-center text-slate-500">
            Pick
          </div>
        {/if}
      </div>
    </div>

    <div class="flex items-center justify-between flex-1">
      <div class="self-start">
        <h3 class="text-lg font-semibold text-slate-100 mb-0.5">
          {stepIdx > -1 ? 'Edit Step' : 'New Step'}
        </h3>
        <p class="text-xs text-slate-400">
          {mode === 'action' ? 'Select a job action' : 'Create a custom step'}
        </p>
      </div>
      <div>
        <button
          class="flex-1 bg-slate-900/60 rounded-lg px-3 py-2 border-2 border-slate-600 min-h-[2.5rem] {!hasKeybind(bindingValue) ? 'border-dashed border-teal-600' : ''} flex items-center cursor-pointer h-16 min-w-40 place-content-center"
          on:click={startInputRecorder}
          title="Set Keybind"
        >
          {#if hasKeybind(bindingValue)}
            <InputRender input={bindingValue} mode="pretty" size="lg" showPlus={true} />
          {:else}
            <span class="text-slate-500 italic">No keybind</span>
          {/if}
        </button>
        <label class="flex items-center gap-2 text-sm text-slate-300 cursor-pointer group mt-2 justify-center">
          <input 
            type="checkbox" 
            class="w-3.5 h-3.5 rounded border-slate-600 bg-slate-900/60 text-primary focus:ring-2 focus:ring-primary/50 cursor-pointer" 
            bind:checked={propagateKeybind} 
          />
          <span
            class="group-hover:text-slate-200 transition-colors"
            title="When enabled, the keybind you set here will also be applied to other steps with identical name."
          >
            Populate
          </span>
          <Icon src={LuInfo} size="1.2em" />
        </label>
      </div>
    </div>
  </div>

  {#if recording}
    <SlotRecorder
      once={true}
      showClear={bindingValue !== undefined}
      bind:this={refRecorder}
      on:input={handleRecorderInput}
      on:cancel={handleRecorderCancel}
    />
  {:else}
    <!-- Mode selection with card-style radio buttons -->
    <div class="grid grid-cols-2 gap-3 mb-4">
      <button 
        type="button" 
        class="relative px-4 py-3 rounded-lg border transition-all text-left {mode === 'action' ? 'border-teal-700 bg-teal-900/20' : 'border-slate-700 hover:border-slate-500'}" 
        on:click={() => setMode('action')}
      >
        <div class="flex items-center gap-2">
          <span class="text-2xl">
            {#if jobIcon}
              <img src={jobIcon} alt="Job" class="h-9 w-9 rounded {mode !== 'action' ? 'grayscale opacity-40' : ''}" />
            {:else}
              <div class="h-8 w-8 shrink-0 rounded bg-slate-700"></div>
            {/if}
          </span>
          <div class="flex-1">
            <div class="font-semibold text-sm text-slate-100">Job Action</div>
            <div class="text-[11px] text-slate-400">Select from job skills</div>
          </div>
        </div>
      </button>
      
      <button 
        type="button" 
        class="relative px-4 py-3 rounded-lg border transition-all text-left {mode === 'custom' ? 'border-teal-600 bg-slate-700/20' : 'border-slate-700  hover:border-slate-500'}" 
        on:click={() => setMode('custom')}
      >
        <div class="flex items-center gap-4">
          <span class="text-2xl">
            <img src="/images/skills/unknown.png" alt="Custom" class="h-7 w-7 shrink-0 rounded {mode !== 'custom' ? 'grayscale opacity-40' : ''}" />
          </span>
          <div class="flex-1">
            <div class="font-semibold text-sm text-slate-100">Custom Step</div>
            <div class="text-[11px] text-slate-400">Create your own</div>
          </div>
        </div>
      </button>
    </div>

    <!-- Main content area -->
    {#if mode === 'action'}
      <!-- Action picker -->
      <div class="space-y-3 mb-3">
        <!-- Filter input standalone -->
        <div>
          <label for="action-search" class="block text-xs font-semibold text-slate-300 mb-2">
            Search Actions
          </label>
          <input
            id="action-search"
            bind:value={actionFilter}
            bind:this={actionFilterRef}
            type="text"
            placeholder="Type to filter actions…"
            class="w-full rounded-lg border-2 border-slate-700 bg-slate-900/40 px-3 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
            on:keyup={checkKey}
          />
        </div>

        <!-- Scrollable grid with cleaner background -->
        <div class="bg-slate-900/30 rounded-lg p-3 overflow-y-auto max-h-[22vh]">
          <div class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
          {#each filteredActions as action (action.icon)}
            <button
              type="button"
              class="group flex items-center gap-2.5 rounded-lg {selectedAction?.icon === action.icon ? 'bg-teal-600/20 ring-2 ring-teal-500' : 'bg-slate-800/60 hover:bg-slate-700/70'} focus:outline-none focus:ring-2 focus:ring-teal-500/40 px-3 py-2 text-left transition-all"
              title={getActionName(suggestions, action.id, language)}
              on:click={() => selectAction(action)}
            >
              <img src={getIconUrl(action.icon)} alt={action.id.toString()} class="h-9 w-9 shrink-0 rounded" />
              <span class="truncate text-sm text-slate-200">{getActionName(suggestions, action.id, language)}</span>
            </button>
          {/each}
          </div>
          {#if filteredActions.length === 0}
            <div class="text-center py-8 text-slate-400 text-xs">
              No actions found
            </div>
          {/if}
        </div>
      </div>
    {:else}
      <!-- Custom step form -->
      <div class="space-y-4 mb-3">
        <!-- Step name -->
        <div>
          <label for="step-name" class="block text-xs font-semibold text-slate-300 mb-2">
            Step Name
          </label>
          <input
            id="step-name"
            bind:value={nameInputValue}
            on:keyup={checkKey}
            class="w-full rounded-lg border-2 border-slate-700 bg-slate-900/40 px-3 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
            placeholder="e.g. Switching hotbars"
          />
        </div>
        
        <!-- Icon selector -->
        <div>
          <div class="block text-xs font-semibold text-slate-300 mb-2">Choose Icon</div>
          <div class="bg-slate-900/30 rounded-lg p-3 overflow-y-auto max-h-[18vh]">
            <div class="grid grid-cols-10 gap-1.5">
              {#each defaultImages as di}
                <button
                  type="button"
                  class="p-0.5 rounded-lg transition-all {imgSrc === di ? 'ring-2 ring-teal-500 shadow-lg shadow-teal-500/20' : 'hover:ring-2 hover:ring-slate-600'}"
                  on:click={() => { imgSrc = di }}
                  aria-pressed={imgSrc === di}
                  title="Select icon"
                >
                  <img src={di} alt="" class="w-full aspect-square rounded object-cover" />
                </button>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Action buttons -->
    <div class="flex gap-2 pt-2 mt-3">
      <button 
        class="flex-1 py-4 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-all disabled:opacity-50" 
        on:click={submit} 
        disabled={!canSubmit}
      >
        {stepIdx > -1 ? 'Save' : 'Create'}
      </button>
      {#if stepIdx > -1}
        <button 
          class="px-3 border border-slate-600 hover:border-slate-500 rounded-lg text-slate-200 text-sm font-medium transition-all hover:bg-slate-800/50" 
          on:click={cancel}
        >
          Cancel
        </button>
        <button
          class="px-3 border border-red-600/50 bg-red-900/20 hover:bg-red-900/40 rounded-lg text-red-300 text-sm font-medium transition-all inline-flex items-center gap-1.5"
          on:click={() => { dispatch('deletestep', { idx: stepIdx }); cancel(); }}
          title="Delete this step"
        >
          <Icon src={FiTrash2} size="14" />
          Delete
        </button>
      {/if}
    </div>
  {/if}
</div>

<InputModal bind:this={refInputModal} on:keybind={(e) => bindingValue = e.detail} />
