<script lang="ts">
  import { rotations, type RotationTemplate } from '$lib/stores'
  import { get } from 'svelte/store'
  import { Icon } from 'svelte-icons-pack'
  import { LuSprout, LuCircle, LuCircleFadingPlus, LuChevronLeft } from "svelte-icons-pack/lu";
  import PageTitle from '$lib/components/page/PageTitle.svelte'
  import { JobsByRole, Jobs } from '$lib/jobs';
  import { crossfade, fade } from 'svelte/transition'
  import { tick } from 'svelte'
  import { goto } from '$app/navigation'
  import { getJobIconUrls } from '$lib/iconLoader'
	import Container from '$lib/components/form/Container.svelte';
	import Button from '$lib/components/form/Button.svelte';
	import { createSlug, isValidRotationName } from '$lib/helpers';
	import RelativeAge from '$lib/components/RelativeAge.svelte';
  import {page} from '$app/stores';
	import Loading from '$lib/components/page/Loading.svelte';
	import LoadingIcon from '$lib/components/page/LoadingIcon.svelte';

  let name = ''
  // let job = ''
  let nameInput: HTMLInputElement | null = null
  let templates: RotationTemplate[] = []
  const loading = {
    jobs: false,
    templates: false
  }
  
  const jobIconUrl = getJobIconUrls()
  
  // Reactively get the job from the URL search params
  $: jobId = $page.url.searchParams.get('job') || ''
  $: jobObj = Jobs.find(j => j.id === jobId)

  $: if (jobId && jobObj?.hasTemplates) {
    loadTemplates(jobId)
  } else {
    templates = []
  }
  
  async function loadTemplates(jobId: string) {
    loading.templates = true
    const module = await import(`$lib/assets/templates/${jobId}.json`)
    templates = module.default || []
    loading.templates = false
  }
  $: xfKey = jobId 

  $: (async () => {
    if (jobObj) {
      await tick()
      nameInput?.focus()
    }
  })()

  const [send, receive] = crossfade({ duration: 220 })

  async function checkKey (e: KeyboardEvent) {
    if (e.key !== 'Enter') {
      return
    }
    await createNewRotation()
  }

  async function createNewRotation () {
    if (!isValidRotationName(name)) {
      return
    }
    const rots = get(rotations)
    if (rots.some(r => r.name === name)) {
      alert('Name already in use')
      return
    }
    const slug = createSlug(name)
    rots.push({ name, job: jobId, slug, steps: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    rotations.set(rots)
    name = ''
    await goto(`/rotations/${slug}`)
  }

  function selectJob (jobId: string) {
    jobId = jobId
    goto(`/rotations?job=${jobId}`)
  }

  function deselectJob () {
    jobId = ''
    name = ''
    goto('/rotations')
  }
  function gotoTemplate(slug: string) {
    return async () => {
      await goto(`/template/${slug}`, { state: { fromRotation: true } })
    }
  }
</script>

<!-- User rotations -->
{#if $rotations.length > 0 && !jobObj}

<Container>
  <PageTitle>
    {#if !jobObj}
      <Button href="#jobs" variant="outline-primary" class="ml-auto float-end">
        New rotation
      </Button>
    {/if}
    <div class="flex items-center gap-3">
      <Icon src={LuCircle} color="#57c5b7" size="1.5em" /> Your rotations
    </div>
  </PageTitle>


  <div class="mt-6 overflow-x-auto">
    <table class="w-full text-sm">
      <thead class="border-b border-slate-700">
        <tr class="text-left text-slate-400">
          <th class="p-3 font-semibold">Rotation</th>
          <th class="p-3 font-semibold text-center">Steps</th>
          <th class="p-3 font-semibold">Updated</th>
          <th class="p-3 font-semibold">Last twirl</th>
        </tr>
      </thead>
      <tbody>
        {#each $rotations as rot}
          <tr class="border-b border-slate-800 hover:bg-slate-700/30 transition-colors">
            <td class="text-slate-200">
              <a href="/rotations/{rot.slug}" class="hover:text-teal-400 transition-colors inline-flex items-center gap-2 w-full py-3">
                {#if jobIconUrl[rot.job]}
                  <img src={jobIconUrl[rot.job]} alt={rot.job} class="h-8 w-8 rounded" />
                {:else}
                  <div class="h-8 w-8 rounded bg-slate-700"></div>
                {/if}
                <span class="">
                  {rot.name}
                </span>
              </a>
            </td>
            <td class="p-2 text-slate-400 text-center">{rot.steps.length}</td>
            <td class="p-2 text-slate-400"><RelativeAge date={new Date(rot.updatedAt)} /></td>
            <td class="p-2 text-slate-400">
              {#if rot.lastTwirlAt}
                <RelativeAge date={new Date(rot.lastTwirlAt)} />
              {:else}
                <span class="text-slate-600 italic">Never</span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

</Container>
{/if}

<!-- Job selection header -->
<Container>
  <PageTitle>
    {#if jobObj}
      <div class="flex items-center gap-3">
        <a type="button" aria-label="Back" on:click={deselectJob} class="inline-flex cursor-pointer items-center justify-center rounded hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50">
          <Icon src={LuChevronLeft} color="#57c5b7" size="1.5em" />
        </a>
        <div in:receive={{ key: xfKey }} out:send={{ key: xfKey }} class="flex items-center gap-3">
          {#if jobIconUrl[jobId]}
            <img src={jobIconUrl[jobId]} alt={jobObj.name} class="h-8 w-8 shrink-0 rounded" />
          {:else}
            <div class="h-8 w-8 shrink-0 rounded bg-slate-700" />
          {/if}
          <span>{jobObj.name}</span>
        </div>
      </div>
    {:else}
      <div class="flex items-center gap-3">
        <Icon src={LuCircleFadingPlus} color="#57c5b7" size="1.5em" /> New rotation
      </div>
    {/if}
  </PageTitle>

  <div>
    <!-- Job list -->
    {#if !jobObj}
      <a id="jobs" aria-label="Job selection"></a>
      <p class="text-subtle mb-4">
        Pick a job and either start from scratch or use and modify a pre-made <a class="text-lime-500" href="/template"><Icon src={LuSprout} size="1.2em" className="inline-block text-green-400" /> template</a> rotation.
      </p>
      <hr class="my-4 border-slate-700">
      <div in:fade={{ duration: 150 }} out:fade={{ duration: 150 }} class="space-y-5">
        {#each JobsByRole as role}
          <div>
            <h3 class="text-sm uppercase tracking-wide text-slate-400 mb-2">{role.name}</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {#each role.jobs as j}
                <a
                  type="button"
                  class="group {role.colorClass} flex items-center gap-3 rounded border p-2 text-left transition hover:border-slate-400 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 {j.id === jobId ? 'border-primary bg-primary/10' : 'border-slate-700'}"
                  aria-pressed={j.id === jobId}
                  href="/rotations?job={j.id}"
                >
                  <span in:receive={{ key: j.id }} out:send={{ key: j.id }} class="flex items-center gap-3">
                    {#if jobIconUrl[j.id]}
                      <img src={jobIconUrl[j.id]} alt={j.name} class="h-8 w-8 shrink-0 rounded" />
                    {:else}
                      <div class="h-8 w-8 shrink-0 rounded bg-slate-700" />
                    {/if}
                    <span class="text-sm">{j.name}</span>
                  </span>
                  {#if j.hasTemplates}
                    <span class="text-lime-500 ml-auto">
                      <Icon src={LuSprout} size="1.2em" className="text-green-400 opacity-40 group-hover:opacity-80" title="This job has rotation templates available" />
                    </span>
                  {/if}
                  </a>
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

        <div class="mt-4 flex justify-end">
          <button
            type="button"
            class="group relative py-2.5 px-6 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 rounded-lg text-white font-semibold text-sm shadow-lg hover:shadow-teal-500/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
            on:click={createNewRotation}
          >
            <span class="flex items-center gap-2">
              Create new rotation
            </span>
          </button>
        </div>
      </div>
    {/if}
  </div>
</Container>

<!-- Template rotations for selected job -->
{#if jobObj}
<Container variant="highlight">
  <PageTitle>
    <div class="flex items-center gap-3">
      <Icon src={LuSprout} color="#57c5b7" size="1.5em" /> Template rotations
    </div>
  </PageTitle>
  {#if loading.templates}
  <LoadingIcon />
  {:else}
    {#if templates?.length}
      <p class="text-subtle">
        These are pre-made rotation templates you can use as a starting point.
      </p>
    {:else}
      <p class="text-subtle">
        Sadly no templates available for this job.
      </p>
    {/if}
    {#each templates as template}
      <button
        on:click={gotoTemplate(template.slug)}
        class="w-full p-2 border rounded border-slate-600 mt-4 relative block hover:border-slate-400 hover:bg-slate-800"
      >
        <div class="flex items-center gap-3">
          {#if jobIconUrl[template.job]}
            <img src={jobIconUrl[template.job]} alt={template.job} class="h-8 w-8 shrink-0 rounded" />
          {:else}
            <div class="h-8 w-8 shrink-0 rounded bg-slate-700" />
          {/if}
          <span>
            {template.name}
          </span>
        </div>
      </button>
    {/each}
  {/if}
</Container>
{/if}
