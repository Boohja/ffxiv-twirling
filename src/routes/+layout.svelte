<script lang="ts">
  import "../app.css";
  import Navbar from '$lib/components/page/Navbar.svelte'
	import Footer from "$lib/components/page/Footer.svelte"
  import { page } from '$app/state'

  let hideNav = $derived(page.url.pathname.includes('/twirl'))
  let isLanding = $derived(page.url.pathname === '/')
</script>

<svelte:head>
  <meta content="FFXIV Twirling" property="og:site_name">
  <meta content="FFXIV Twirling - Practice Rotation Keybinds in the Browser" property="og:title">
  <meta content="Pick your job, build your rotation from scratch or copy a template, assign keybinds and practice your rotations in the browser." property="og:description">
  <meta content="https://ffxiv-twirling.vercel.app/embed_logo.png" property="og:image">
  <meta content="FFXIV Twirling" name="twitter:title">
</svelte:head>

{#if !isLanding}
  <div class="block md:hidden absolute top-0 left-0 right-0 bottom-0 z-50 bg-gradient-to-tr from-teal-800 to-slate-800">
    <div class="flex flex-col items-center justify-center h-full">
      <img src="/ffxiv-twirling.svg" alt="ffxiv-twirling logo" class="w-20 mb-6 block" />
      <span class="text-slate-200 text-xl text-center">
        This page is not meant<br>for small devices
      </span>
      <a href="/" class="mt-4 text-teal-400 hover:underline">Go back</a>
    </div>
  </div>
{/if}

{#if hideNav}
  <slot />
{:else}
  <div style="display: flex; flex-direction: column; min-height: 100vh;">
    <Navbar />

    <div class="container mx-auto text-slate-200 mt-32" style="flex: 1;">
      <slot />
    </div>
    <div>
      <Footer />
    </div>
  </div>
{/if}