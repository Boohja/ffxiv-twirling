<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import Button from "$lib/components/form/Button.svelte";
	import Loading from "$lib/components/page/Loading.svelte";
	import PageTitle from "$lib/components/page/PageTitle.svelte";
	import RotationStepList from "$lib/components/twirling/RotationStepList.svelte";
	import { createSlug, isValidRotationName } from "$lib/helpers";
	import { getIconUrl, getJobIconUrl } from "$lib/iconLoader";
  import { Jobs, type Job } from '$lib/types/jobs';
	import { rotations, type RotationTemplate } from "$lib/stores";
  import { onMount } from 'svelte'
	import { Icon } from "svelte-icons-pack";
	import { BiChevronLeft } from "svelte-icons-pack/bi";
	import { LuChevronLeft, LuSprout } from "svelte-icons-pack/lu";
	import { get } from "svelte/store";
	import type { J } from "vitest/dist/chunks/environment.LoooBwUu.js";

  let templates: RotationTemplate[] = []
  let rotation: RotationTemplate | null = null
  let loading = true
  let jobIconUrl = ''
  let name = ''
  let job: Job | undefined = undefined
  let fromRotation = false

  onMount(async () => {
    fromRotation = page.state?.fromRotation || false
    const slug = page.params?.slug || ''
    const jobName = slug.substring(0, 3)
    job = Jobs.find(j => j.id === jobName)
    if (!job || !job.hasTemplates) {
      await goto('/rotations')
      return
    }
    const module = await import(`$lib/assets/templates/${job.id}.json`)
    templates = module.default || []
    rotation = templates.find(t => t.slug === slug) || null
    if (!rotation) {
      await goto('/rotations')
      return
    }
    jobIconUrl = rotation?.job ? getJobIconUrl(rotation.job) : ''
    name = job.id.toUpperCase() + ' ' + rotation.name.replace(/\(.*?\)/, '').trim()
    loading = false
  })

  async function checkKey (e: KeyboardEvent) {
    if (e.key !== 'Enter') {
      return
    }
    await copyTemplate()
  }

  async function copyTemplate() {
    if (!job || !isValidRotationName(name)) {
      return
    }
    const localRotations = get(rotations)
    if (localRotations.some(r => r.name === name)) {
      alert('Name already in use')
      return
    }
    const slug = createSlug(name)
    localRotations.push({ name, job: job.id, slug, steps: rotation?.steps || [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    rotations.set(localRotations)
    await goto(`/rotations/${slug}`)
  }
</script>

{#if loading}
  <Loading />
{/if}


<div class="p-6 border border-slate-700/50 rounded-xl mb-8 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm shadow-xl">
  <PageTitle>
    <div class="flex items-center gap-3">
      <a href="{fromRotation ? `/rotations?job=${job?.id}` : '/template'}">
        <Icon src={LuChevronLeft} color="#57c5b7" size="1.5em" />
      </a>
      <div class="flex items-center gap-3">
        {#if jobIconUrl}
          <img src={jobIconUrl} alt={rotation?.job || 'Job'} class="h-12 w-12 shrink-0 shadow-lg ring-slate-600/50" />
        {:else}
          <div class="h-8 w-8 shrink-0 rounded-lg bg-slate-700 shadow-lg"></div>
        {/if}
        <span>{rotation?.name}</span>
      </div>
    </div>
  </PageTitle>
  <div class="mt-4 space-y-2 text-sm text-slate-300">
    <div class="flex items-center gap-2">
      <span class="text-slate-400 font-medium">Source:</span>
      <a href="{rotation?.url}" class="text-teal-400 hover:text-teal-300 hover:underline transition-colors" target="_blank" rel="noopener noreferrer">{rotation?.url}</a>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-slate-400 font-medium">Last Updated:</span>
      <span class="text-slate-200">{rotation?.updated}</span>
    </div>
  </div>
</div>


<div class="grid gap-6 grid-cols-2">
  <div class="border border-slate-600 p-3 rounded mb-8 bg-slate-600/10 container-job container-{job?.id}">
    <RotationStepList
      steps={rotation?.steps}
      iconUrl={getIconUrl}
      readonly={true}
    />
  </div>


  <div class="p-6 border border-slate-700/50 rounded-xl mb-8 bg-gradient-to-br from-teal-900/20 via-slate-800/60 to-slate-900/60 backdrop-blur-sm shadow-xl sticky top-4 self-start">
    <div class="flex items-center gap-3 mb-4">
      <div class="p-2 bg-teal-500/10 rounded-lg">
        <Icon src={LuSprout} size="2em" className="text-teal-400" />
      </div>
      <h2 class="text-xl font-semibold text-slate-100">About Template Rotations</h2>
    </div>
    <p class="text-slate-300 leading-relaxed mb-6">
      This is a template rotation. You can copy it to your own rotations by clicking the button below to start practicing and customizing it.
    </p>

    <hr class="my-4 border-slate-700">

    <p class="text-subtle">When you are ready to copy this template, choose a name for your new rotation and click the button below.</p>

    <input
      id="rotationName"
      bind:value={name}
      on:keydown={checkKey}
      class="w-full rounded-lg my-4 border border-slate-600 bg-slate-900/40 py-2.5 px-3 text-slate-100 placeholder-slate-400 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
      placeholder="e.g. Opener, Dungeon, Raid opener"
    />

    <div class="flex justify-end">
      <Button variant="primary" onclick={copyTemplate}>
        Copy Template
      </Button>
    </div>
  </div>

  
</div>
