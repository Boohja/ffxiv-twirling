<script lang="ts">
  import "../app.css";
  import Navbar from '$lib/components/page/Navbar.svelte'
	import Footer from "$lib/components/page/Footer.svelte"
  import { page } from '$app/state'

  let hideNav = $derived(page.url.pathname.includes('/twirl'))
</script>

{#if hideNav}
  <slot />
{:else}
  <div style="display: flex; flex-direction: column; min-height: 100vh;">
    <Navbar />

    <div class="container mx-auto text-slate-200" style="position: relative; flex: 1;">
      <slot />
    </div>

    <div>
      <Footer />
    </div>
  </div>
{/if}