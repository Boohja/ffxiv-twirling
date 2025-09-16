<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { rotations, type Rotation } from '$lib/stores'
  import { get } from 'svelte/store'
	import EmptySlot from "$lib/components/twirling/EmptySlot.svelte";
  import PageTitle from '$lib/components/page/PageTitle.svelte'
  import { Icon } from 'svelte-icons-pack'
  import { BiChevronLeft } from 'svelte-icons-pack/bi'
	import { error } from '@sveltejs/kit';
	import { onMount } from 'svelte';
  import fs from 'fs'

  const rots = get(rotations)
  let rotation: Rotation
  let jobActions: any[] = []
  let loading = true
  let actionFilter = ''
  console.log($page.params)

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
        goto('/rotations')
        return
      }
      rotation = rot
      // const foo = await fetch('/api/actions/' + rotation.job)
      const foo = await import('$lib/assets/xiv/jobs/drg.json')
      jobActions = foo.default
      console.log(rotation, $page.params?.slug)
      console.log(jobActions)
    } finally {
      loading = false
    }
  })

  function newEntry (e: CustomEvent) {
    console.log(rots)
    rotation?.steps.push({
      name: e.detail.name
    })
    rotations.set(rots)
  }

  function pickAction(action: any) {
    if (!rotation) return
    rotation.steps = rotation.steps || []
    rotation.steps.push({ name: action.name })
    rotations.set(rots)
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
  <div class="border border-slate-500">
    <div>
      Rotation
      <EmptySlot on:newentry={newEntry} suggestions={jobActions} />
    </div>
    <div>
      Tadaa

      {#each (rotation?.steps || []) as step}
        <div
          class="p-4 border rounded border-slate-600 mt-4 relative block"
        >
          {step.name}
    </div>
      {/each}
    </div>
  </div>

  <div class="border border-slate-500">
    Pool
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
