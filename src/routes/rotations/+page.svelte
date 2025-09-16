<script lang="ts">
  import { rotations } from '$lib/stores'
  import { get } from 'svelte/store'
  import { Icon } from 'svelte-icons-pack'
  import { BiChevronLeft, BiRadioCircle } from 'svelte-icons-pack/bi'
  import PageTitle from '$lib/components/page/PageTitle.svelte'
  import { JobsByRole, Jobs } from '$lib/jobs';
  import { crossfade, fade } from 'svelte/transition'
  import { tick } from 'svelte'
  import { goto } from '$app/navigation'

  let name = ''
  let job = ''
  let lastSelected = ''
  let nameInput: HTMLInputElement | null = null

  // Load job icons dynamically from assets directory
  const iconModules = import.meta.glob<string>('$lib/assets/xiv/jobs/*.png', { eager: true, as: 'url' })
  const jobIconUrl: Record<string, string> = {}
  for (const path in iconModules) {
    const base = path.split('/').pop() || ''
    const id = base.replace(/\.png$/i, '')
    jobIconUrl[id] = iconModules[path] as string
  }

  $: selectedJob = Jobs.find(j => j.id === job)
  $: xfKey = job || lastSelected

  // When a job is selected, focus the rotation name input after the DOM updates
  $: (async () => {
    if (selectedJob) {
      await tick()
      nameInput?.focus()
    }
  })()

  const [send, receive] = crossfade({ duration: 220 })

  async function checkKey (e: KeyboardEvent) {
    if (e.key !== 'Enter' || name.length < 1) {
      return
    }
    const rots = get(rotations)
    if (rots.some(r => r.name === name)) {
      alert('Name already in use')
      return
    }
    const slug = name.toLowerCase().replaceAll(' ', '-').replace(/[^a-z0-9-]+/g, '').replace(/^-+|-+$/g, '').substring(0, 50)
    rots.push({ name, job, slug, steps: [] })
    rotations.set(rots)
    name = ''
    await goto(`/rotations/${slug}`)
  }

  function newEntry (e: CustomEvent) {
    console.log(e.detail.name)
  }
</script>

<!-- User rotations -->
{#if $rotations.length > 0}
<div class="p-4 border border-slate-900/60 rounded mb-8 bg-slate-900/40">
  <PageTitle>
    <div class="flex items-center gap-3">
      <Icon src={BiRadioCircle} size="1.5em" /> Your rotations
    </div>
  </PageTitle>

  {#each $rotations as rot}
    <a
      href="/rotations/{rot.slug}"
      class="p-2 border rounded border-slate-600 mt-4 relative block"
    >
      <div class="flex items-center gap-3">
        {#if jobIconUrl[rot.job]}
          <img src={jobIconUrl[rot.job]} alt={rot.job} class="h-8 w-8 shrink-0 rounded" />
        {:else}
          <div class="h-8 w-8 shrink-0 rounded bg-slate-700" />
        {/if}
        <span>
          {rot.name}
        </span>
      </div>
    </a>
  {/each}
</div>
{/if}

<!-- Job selection header -->
<div class="p-4 border border-slate-900/60 rounded mb-8 bg-slate-900/40">
  <PageTitle>
    {#if selectedJob}
      <div class="flex items-center gap-3">
        <button type="button" aria-label="Back" on:click={() => { lastSelected = job || lastSelected; job = ''; name = ''; }} class="inline-flex items-center justify-center rounded hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50">
          <Icon src={BiChevronLeft} size="1.5em" />
        </button>
        <div in:receive={{ key: xfKey }} out:send={{ key: xfKey }} class="flex items-center gap-3">
          {#if jobIconUrl[job]}
            <img src={jobIconUrl[job]} alt={selectedJob.name} class="h-8 w-8 shrink-0 rounded" />
          {:else}
            <div class="h-8 w-8 shrink-0 rounded bg-slate-700" />
          {/if}
          <span>{selectedJob.name}</span>
        </div>
      </div>
    {:else}
      <div class="flex items-center gap-3">
        <Icon src={BiRadioCircle} size="1.5em" /> New rotation, pick a job
      </div>
    {/if}
  </PageTitle>

  <div>
    <!-- Job list -->
    {#if !selectedJob}
      <div in:fade={{ duration: 150 }} out:fade={{ duration: 150 }} class="space-y-5">
        {#each JobsByRole as role}
          <div>
            <h3 class="text-sm uppercase tracking-wide text-slate-400 mb-2">{role.name}</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {#each role.jobs as j}
                <button
                  type="button"
                  class="group flex items-center gap-3 rounded border p-2 text-left transition hover:border-slate-400 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 {j.id === job ? 'border-primary bg-primary/10' : 'border-slate-700'}"
                  aria-pressed={j.id === job}
                  on:click={() => { lastSelected = j.id; job = j.id }}
                >
                  <span in:receive={{ key: j.id }} out:send={{ key: j.id }} class="flex items-center gap-3">
                    {#if jobIconUrl[j.id]}
                      <img src={jobIconUrl[j.id]} alt={j.name} class="h-8 w-8 shrink-0 rounded" />
                    {:else}
                      <div class="h-8 w-8 shrink-0 rounded bg-slate-700" />
                    {/if}
                    <span class="text-sm">{j.name}</span>
                  </span>
                </button>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    <!-- Rotation name -->
    {:else}
      <div in:fade={{ duration: 150 }} out:fade={{ duration: 150 }} class="mt-1">
        <label for="rotationName" class="mb-2 block text-sm font-medium text-slate-300">Name your rotation</label>
        <input
          id="rotationName"
          bind:this={nameInput}
          bind:value={name}
          on:keydown={checkKey}
          class="w-full rounded-lg border border-slate-600 bg-slate-900/40 py-2.5 px-3 text-slate-100 placeholder-slate-400 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="e.g. Opener, Dungeon, Raid opener"
        />
        <p class="mt-2 text-xs text-slate-400">Press Enter to create and continue.</p>
      </div>
    {/if}
  </div>

</div>
