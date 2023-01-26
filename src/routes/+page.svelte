<script lang="ts">
	import Slot from "$lib/components/twirling/Slot.svelte";

  async function loadData() {
    try {
      const res = await fetch('https://xivapi.com/search?string=Disembowel')
      console.log(await res.json())
    }
    catch (err) {
      console.log(err)
    }
  }
</script>

<div class="grid gap-4 grid-cols-2">
  <div class="border border-slate-500">
    Rotation
    <Slot />
  </div>
  <div class="border border-slate-500">
    Pool
  </div>
</div>
