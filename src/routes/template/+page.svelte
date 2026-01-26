<script lang="ts">
  import { rotations, type RotationTemplate } from '$lib/stores'
  import { get } from 'svelte/store'
  import { Icon } from 'svelte-icons-pack'
  import { LuSprout, LuCircle, LuCircleFadingPlus, LuChevronLeft } from "svelte-icons-pack/lu";
  import PageTitle from '$lib/components/page/PageTitle.svelte'
  import { JobsByRole, Jobs } from '$lib/jobs';
  import { crossfade, fade } from 'svelte/transition'
  import { onMount, tick } from 'svelte'
  import { goto } from '$app/navigation'
  import { getJobIconUrl, getJobIconUrls } from '$lib/iconLoader'
	import Container from '$lib/components/form/Container.svelte';
	import Button from '$lib/components/form/Button.svelte';
	import { createSlug, isValidRotationName } from '$lib/helpers';
	import RelativeAge from '$lib/components/RelativeAge.svelte';
  import {page} from '$app/stores';
	import Loading from '$lib/components/page/Loading.svelte';
	import LoadingIcon from '$lib/components/page/LoadingIcon.svelte';

  $: loading = true;
  let templates: RotationTemplate[] = []
  // $: () => {
  //   loading = true;
  //   templates = [];
  //   for(const role of JobsByRole) {
  //     for(const job of Jobs.filter(j => j.hasTemplates && j.role === role.id)) {
  //       loadTemplates(job.id);
  //     }
  //   }
  //   loading = false;
  // }

  onMount(async () => {
    for(const role of JobsByRole) {
      for(const job of Jobs.filter(j => j.hasTemplates && j.role === role.id)) {
        await loadTemplates(job.id)
      }
    }
    loading = false
  })

  async function loadTemplates(jobId: string) {
    const module = await import(`$lib/assets/templates/${jobId}.json`)
    templates = templates.concat(module.default || [])
  }
</script>



<Container variant="highlight">
  <PageTitle>
    <div class="flex items-center gap-3">
      <Icon src={LuSprout} color="#57c5b7" size="1.5em" /> Template rotations
    </div>
  </PageTitle>
  <p class="text-subtle">
    These are pre-made rotation templates you can use as a starting point.
  </p>


  {#if loading}
    <div class="flex justify-center my-12">
      <LoadingIcon />
    </div>
  {:else}
    <table class="w-full text-sm">
      <thead class="border-b border-slate-700">
        <tr class="text-left text-slate-400">
          <th class="p-3 font-semibold">Rotation</th>
          <th class="p-3 font-semibold text-center">Steps</th>
        </tr>
      </thead>
      <tbody>
        {#each templates as temp}
          <tr class="border-b border-slate-800 hover:bg-slate-700/30 transition-colors">
            <td class="text-slate-200">
              <a href="/template/{temp.slug}" class="hover:text-teal-400 transition-colors inline-flex items-center gap-2 w-full py-3">
                <img src={getJobIconUrl(temp.job)} alt={temp.job} class="h-8 w-8 rounded" />
                <span class="">
                  {temp.name}
                </span>
              </a>
            </td>
            <td class="p-2 text-slate-400 text-center">{temp.steps.length}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

</Container>
