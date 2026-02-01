<script lang="ts">
  import { page } from '$app/stores'
  import { twirls, type TwirlStep } from '$lib/stores'
  import { goto } from '$app/navigation'
  import PageTitle from '$lib/components/page/PageTitle.svelte'
  import InputRender from '$lib/components/twirling/InputRender.svelte'
  import { Icon } from 'svelte-icons-pack'
  import { BiChevronLeft } from 'svelte-icons-pack/bi'
  import { getIconUrl, getJobIconUrls, loadJobActions } from '$lib/iconLoader'
  import { onMount } from 'svelte'
	import { getStepName } from '$lib/helpers';
	import type { ActionLanguage, JobAction } from '$lib/types/jobActions';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';

  const jobIconUrl = getJobIconUrls()
  
  $: idx = parseInt($page.params.idx || '')
  $: twirl = $twirls[idx]
  
  let jobActions: JobAction[] = []
  let imageError: Record<number, boolean> = {}
  let language: ActionLanguage = 'en'
  
  // Redirect if invalid index
  onMount(async () => {
    if (isNaN(idx) || idx < 0 || idx >= $twirls.length) {
      goto('/recordings')
    }
    language = twirl?.rotation?.language || 'en'
    jobActions = await loadJobActions(twirl.rotation.job)
  })

  function formatDate(isoString: string): string {
    return new Date(isoString).toLocaleString()
  }

  function formatDuration(ms: number): string {
    const seconds = (ms / 1000).toFixed(2)
    return `${seconds}s`
  }

  function getActionImageUrl(icon: string, actionId?: number): string {
    if (actionId) {
      return getIconUrl(icon)
    } else {
      return `/images/skills/${icon}`
    }
  }

  function handleImageError(stepIndex: number) {
    imageError[stepIndex] = true
  }

  type StepState = 'perfect' | 'slow' | 'error' | 'skipped'

  function getStepState(step: TwirlStep): StepState {
    // Grey: skipped (missing data)
    if (step.duration === 0 || !step.correct && step.inputs.length === 0 && !step.timeout) return 'skipped'
    
    // Handle timeout cases
    if (step.timeout) {
      // timeout + correct: false -> error behavior "continue", step is wrong (red)
      if (!step.correct) return 'error'
      
      // timeout + correct: true -> error behavior "stay"
      if (step.inputs.length === 1) {
        // Single correct input but took too long (yellow)
        return 'slow'
      } else if (step.inputs.length > 1) {
        // Correct in the end but had errors along the way (red)
        return 'error'
      }
    }
    
    // Green: perfect (single input and correct, no timeout)
    if (step.inputs.length === 1 && step.correct) return 'perfect'
    
    // Red: everything else (errors)
    return 'error'
  }

  function getStepStateColor(state: StepState): string {
    switch (state) {
      case 'perfect': return 'bg-green-600 text-white'
      case 'slow': return 'bg-yellow-600 text-white'
      case 'error': return 'bg-red-600 text-white'
      case 'skipped': return 'bg-slate-600 text-slate-300'
    }
  }

  function getStepStateBadge(state: StepState, step: TwirlStep): { text: string, class: string } {
    switch (state) {
      case 'perfect':
        return { text: 'Perfect', class: 'bg-green-900/30 text-green-400 border-green-800' }
      case 'slow':
        return { text: 'Timeout', class: 'bg-yellow-900/30 text-yellow-400 border-yellow-800' }
      case 'error':
        if (step.timeout && twirl.config.errorBehavior === 'continue') {
          return { text: 'Timeout', class: 'bg-red-900/30 text-red-400 border-red-800' }
        }
        return { text: 'Error', class: 'bg-red-900/30 text-red-400 border-red-800' }
      case 'skipped':
        return { text: 'Skipped', class: 'bg-slate-700/50 text-slate-400 border-slate-600' }
    }
  }

  function getDurationColor(step: TwirlStep, state: StepState): string {
    if (!step.timeout) return 'text-slate-400'
    switch (state) {
      case 'slow': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-slate-400'
    }
  }
</script>

{#if twirl}
  <div class="p-4 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <a 
        href="/recordings" 
        class="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 mb-4 transition-colors"
      >
        <Icon src={BiChevronLeft} size="1.2em" />
        Back to Recordings
      </a>

      <PageTitle>
        <div class="flex items-center gap-3">
          {#if jobIconUrl[twirl.rotation.job]}
            <img src={jobIconUrl[twirl.rotation.job]} alt={twirl.rotation.job} class="h-14 w-14 rounded" />
          {:else}
            <div class="h-14 w-14 rounded bg-slate-700"></div>
          {/if}
          <div>
            <div class="text-2xl font-bold">{twirl.rotation.name}</div>
            <div class="text-sm text-slate-400 font-normal">Recording #{idx + 1}</div>
          </div>
        </div>
      </PageTitle>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="p-4 rounded-lg border border-slate-700 bg-slate-800/50">
        <div class="text-xs text-slate-400 mb-1">Status</div>
        {#if twirl.correct}
          <div class="text-2xl font-bold text-green-400">✓ Perfect</div>
        {:else}
          <div class="text-2xl font-bold text-red-400">✗ Had Errors</div>
        {/if}
      </div>

      <div class="p-4 rounded-lg border border-slate-700 bg-slate-800/50">
        <div class="text-xs text-slate-400 mb-1">Duration</div>
        <div class="text-2xl font-bold text-teal-400">{formatDuration(twirl.duration)}</div>
      </div>

      <div class="p-4 rounded-lg border border-slate-700 bg-slate-800/50">
        <div class="text-xs text-slate-400 mb-1">Total Steps</div>
        <div class="text-2xl font-bold text-slate-200">{twirl.steps.length}</div>
      </div>

      <div class="p-4 rounded-lg border border-slate-700 bg-slate-800/50">
        <div class="text-xs text-slate-400 mb-1">Total Attempts</div>
        <div class="text-2xl font-bold text-slate-200">
          {twirl.steps.reduce((sum, step) => sum + step.inputs.length, 0)}
        </div>
      </div>
    </div>

    <!-- Config & Timeline -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="p-4 rounded-lg border border-slate-700 bg-slate-800/50">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">Configuration</h3>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-slate-400">Error Behavior:</dt>
            <dd class="text-slate-200 font-mono">{twirl.config.errorBehavior}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-400">Sounds:</dt>
            <dd class="text-slate-200">{twirl.config.playSounds ? 'Enabled' : 'Disabled'}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-400">Timeout:</dt>
            <dd class="text-slate-200">{twirl.config.timeout ? `${twirl.config.timeout}s` : 'None'}</dd>
          </div>
        </dl>
      </div>

      <div class="p-4 rounded-lg border border-slate-700 bg-slate-800/50">
        <h3 class="text-sm font-semibold text-slate-300 mb-3">Timeline</h3>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-slate-400">Started:</dt>
            <dd class="text-slate-200 text-xs">{formatDate(twirl.startedAt)}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-400">Ended:</dt>
            <dd class="text-slate-200 text-xs">{formatDate(twirl.endedAt)}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-400">Duration:</dt>
            <dd class="text-slate-200">{formatDuration(twirl.duration)}</dd>
          </div>
        </dl>
      </div>
    </div>

    <!-- Steps Detail -->
    <div class="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
      <div class="p-4 border-b border-slate-700 bg-slate-900/50">
        <div class="flex items-center gap-3">
          <div>
            <h3 class="text-lg font-semibold text-slate-200">Step-by-Step Analysis</h3>
            <p class="text-xs text-slate-400 mt-1">Original expected inputs vs. your inputs</p>
          </div>
          <div class="ml-auto">
            <LanguageSelector bind:language={language} />
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-900/50 border-b border-slate-700">
            <tr class="text-xs text-slate-400 uppercase tracking-wider">
              <th class="px-4 py-3 text-center w-16">#</th>
              <th class="px-4 py-3 text-left">Action</th>
              <th class="px-4 py-3 text-left w-32">Expected</th>
              <th class="px-4 py-3 text-left w-64">Wrong Attempts</th>
              <th class="px-4 py-3 text-right w-28">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-700">
            {#each twirl.steps as step, i}
              {@const wrongInputs = step.inputs.filter(input => !input.correct)}
              {@const stepState = getStepState(step)}
              {@const stateBadge = getStepStateBadge(stepState, step)}
              
              <tr class="hover:bg-slate-700/30 transition-colors">
                <!-- Step Number -->
                <td class="px-4 py-4">
                  <div class="flex justify-center">
                    <div class="w-8 h-8 rounded-full {getStepStateColor(stepState)} flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>
                  </div>
                </td>

                <!-- Action Info -->
                <td class="px-4 py-4">
                  <div class="flex items-center gap-3">
                    {#if !imageError[i]}
                      <img 
                        src={getActionImageUrl(step.original.icon, step.original.action)}
                        alt={step.original.name}
                        class="w-10 h-10 rounded border border-slate-600 flex-shrink-0"
                        on:error={() => handleImageError(i)}
                      />
                    {:else}
                      <div class="w-10 h-10 rounded border border-slate-600 bg-slate-700 flex items-center justify-center text-xs text-slate-400 flex-shrink-0">
                        ?
                      </div>
                    {/if}
                    
                    <div>
                      <div class="font-semibold text-slate-200">{getStepName(jobActions, step.original, language)}</div>
                      <div class="text-xs mt-0.5">
                        <span class="text-slate-400">{step.inputs.length} input{step.inputs.length !== 1 ? 's' : ''} • </span>
                        <span class="{getDurationColor(step, stepState)}">{formatDuration(step.duration)}</span>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Expected Input -->
                <td class="px-4 py-4 justify-items-end">
                  {#if step.original.input}
                    <InputRender input={step.original.input} mode="pretty" size="sm" showPlus={false} />
                  {:else}
                    <span class="text-slate-500 text-xs">None</span>
                  {/if}
                </td>

                <!-- Wrong Inputs List -->
                <td class="px-4 py-4 justify-items-start">
                  {#if wrongInputs.length > 0}
                    <div class="space-y-1">
                      {#each wrongInputs as wrongInput, j}
                        <div class="flex items-center gap-2 text-xs">
                          <InputRender input={wrongInput.input} mode="pretty" size="sm" showPlus={false} />
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <div class="text-xs text-slate-600">—</div>
                  {/if}
                </td>

                <!-- Summary Badge -->
                <td class="px-4 py-4 text-right">
                  <span class="inline-block px-3 py-1 rounded text-xs font-medium border {stateBadge.class}">
                    {stateBadge.text}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
{:else}
  <div class="p-4">
    <div class="mt-8 rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center">
      <p class="text-slate-400">Twirl recording not found.</p>
      <a 
        href="/recordings" 
        class="mt-4 inline-block px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg text-sm font-medium transition-colors"
      >
        Back to Recordings
      </a>
    </div>
  </div>
{/if}
