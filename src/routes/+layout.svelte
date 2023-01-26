<script>
  import "../app.css";
  import Navbar from '$lib/components/page/Navbar.svelte'
</script>

<Navbar />

<div class="container mx-auto text-slate-200">
  <slot />
</div>