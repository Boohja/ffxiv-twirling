<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { rotations, type Rotation } from '$lib/stores'
  import { get } from 'svelte/store'
	import EmptySlot from "$lib/components/twirling/EmptySlot.svelte";
	import { error } from '@sveltejs/kit';
	import { onMount } from 'svelte';
  import fs from 'fs'

  const rots = get(rotations)
  let rotation: Rotation
  let jobActions: any[] = []
  console.log($page.params)

  onMount(async () => {
    const rot = rots.find(r => r.name === $page.params?.slug)
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
  })

  function newEntry (e: CustomEvent) {
    console.log(rots)
    rotation?.steps.push({
      name: e.detail.name
    })
    rotations.set(rots)
  }
</script>

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
</div>