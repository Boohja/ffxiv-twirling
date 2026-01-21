<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  
  const dispatch = createEventDispatcher()
  
  export let show: boolean = false
  
  let count = 3
  
  $: if (show) {
    startCountdown()
  }
  
  function startCountdown() {
    count = 3
    
    const interval = setInterval(() => {
      count--
      
      if (count <= 0) {
        clearInterval(interval)
        show = false
        dispatch('complete')
      }
    }, 1000)
  }
</script>

{#if show && count > 0}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm">
    <div class="text-center">
      <div class="countdown-number text-white font-bold drop-shadow-2xl">
        {count}
      </div>
    </div>
  </div>
{/if}

<style>
  .countdown-number {
    font-size: 15rem;
    animation: countdownPulse 0.8s ease-out;
  }
  
  @keyframes countdownPulse {
    0% {
      transform: scale(0.5);
      opacity: 0;
    }
    50% {
      transform: scale(1.2);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
