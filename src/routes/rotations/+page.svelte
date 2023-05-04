<script lang="ts">
  import { rotations } from '$lib/stores'
  import { get } from 'svelte/store'
  import Icon from 'svelte-icons-pack/Icon.svelte';
  import CgChevronRight from 'svelte-icons-pack/cg/CgChevronRight.js';
  import { JobsByRole } from '$lib/jobs';

  let name = ''
  let job = ''

  function checkKey (e: KeyboardEvent) {
    if (e.key !== 'Enter' || name.length < 1) {
      return
    }
    const rots = get(rotations)
    if (rots.some(r => r.name === name)) {
      alert('Name already in use')
      return
    }
    rots.push({ name, job, steps: [] })
    rotations.set(rots)
    name = ''
  }

  function newEntry (e: CustomEvent) {
    console.log(e.detail.name)
  }
</script>

<div class="p-4 border rounded border-slate-600 mb-8">
  Job:<br>
  <select bind:value={job} class="py-1 px-2 text-slate-900">
    {#each JobsByRole as role}
      <optgroup label={role.name}>
      {#each role.jobs as job}
        <option value={job.id}>{job.name}</option>
      {/each}
      </optgroup>
    {/each}
    <option value=''>No job</option>
  </select><br><br>
  Name of your rotation:<br>
  <input bind:value={name} on:keydown={checkKey} class="py-1 px-2 text-slate-900">
</div>


{#each $rotations as rot}
  <a
    href="/rotations/{rot.name}"
    class="p-4 border rounded border-slate-600 mt-4 relative block"
  >
    {rot.name}
    <Icon src={CgChevronRight} size="2em" className="absolute right-3 top-3" />
  </a>
{/each}

