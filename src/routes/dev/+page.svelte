<script lang="ts">
	import { InputSnapshot } from "$lib/inputParser";


  const snapshot = new InputSnapshot()
  if (typeof window !== 'undefined') {
    window.addEventListener("keydown", snapshot.processKeyboardEvent);
    window.addEventListener("keyup", snapshot.processKeyboardEvent);
    window.addEventListener("mousedown", snapshot.processMouseEvent);
    window.addEventListener("mouseup", snapshot.processMouseEvent);
    window.addEventListener("contextmenu", snapshot.processMouseEvent);

    pollGamepads();
  }

  snapshot.onCancelInput((snap) => {
    console.log("Cancelled input:", snap);
  })

  snapshot.onValidSnapshot((snap) => {
    console.info("Valid input:", snap);
  })


  function pollGamepads() {
    const gamepads = navigator.getGamepads();
    
    snapshot.processGamepads(gamepads);
    
    requestAnimationFrame(pollGamepads);
  }
</script>


<div>
  <h2 class="text-lg font-semibold mb-3 text-slate-300">Recorded Inputs:</h2>
  <div class="rounded-lg border border-slate-700 bg-slate-900 p-4">
    <!-- {#if recordedInputs.length === 0}
      <p class="text-slate-500">No inputs recorded yet</p>
    {:else}
      <ul class="space-y-2">
        {#each recordedInputs as input, i}
          <li class="text-slate-300 font-mono">
            {i + 1}. {formatKeybind(input)} 
            <span class="text-xs text-slate-500 ml-2">
              {JSON.stringify(input)}
            </span>
          </li>
        {/each}
      </ul>
    {/if} -->
  </div>
</div>