<script lang="ts">
  export let visible: boolean = true;
</script>

{#if visible}
<div class="loading-gradient p-8 text-center text-slate-300 fixed top-0 bottom-0 left-0 right-0 z-10 flex items-center justify-center grayscale2" aria-busy="true">
  <div class="flex flex-col items-center gap-3">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
    <span class="text-lg font-medium">Loading...</span>
  </div>
</div>
{/if}

<style scoped>
.loading-gradient {
  background: linear-gradient(to bottom right, #181818 , #282828 , #181818)!important;
}
</style>