<script lang="ts">
	import { InputSnapshot } from "$lib/inputParser";
  import { twirls } from "$lib/stores";


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

  function clearTwirls() {
    if (confirm('Are you sure you want to clear all recorded twirls?')) {
      twirls.set([])
    }
  }

  function formatDate(isoString: string): string {
    return new Date(isoString).toLocaleString()
  }

  function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
  <div class="max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold mb-8">Dev Tools</h1>

    <!-- Twirls Section -->
    <section class="mb-12">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-semibold text-slate-300">Recorded Twirls</h2>
        <button
          on:click={clearTwirls}
          class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
        >
          Clear All Twirls
        </button>
      </div>
      
      <div class="space-y-4">
        {#if $twirls.length === 0}
          <div class="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center">
            <p class="text-slate-400">No twirls recorded yet. Practice a rotation to see data here.</p>
          </div>
        {:else}
          {#each $twirls as twirl, i}
            <details class="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
              <summary class="cursor-pointer p-4 hover:bg-slate-700/50 transition-colors">
                <div class="flex items-center justify-between">
                  <div>
                    <span class="font-semibold text-teal-400">#{i + 1}</span>
                    <span class="ml-3 text-slate-300">{twirl.rotation.name}</span>
                    <span class="ml-2 text-slate-500 text-sm">({twirl.rotation.job.toUpperCase()})</span>
                    <span class="ml-3 text-slate-500 text-sm">{formatDate(twirl.startedAt)}</span>
                  </div>
                  <div class="text-right">
                    <div class="text-teal-400 font-semibold">{formatDuration(twirl.duration)}</div>
                    <div class="text-sm text-slate-400">{twirl.steps.length} steps</div>
                  </div>
                </div>
              </summary>
              
              <div class="p-4 border-t border-slate-700 bg-slate-900/50">
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 class="text-sm font-semibold text-slate-400 mb-2">Config</h4>
                    <ul class="text-sm text-slate-300 space-y-1">
                      <li>Error Behavior: <span class="text-teal-400">{twirl.config.errorBehavior}</span></li>
                      <li>Sounds: <span class="text-teal-400">{twirl.config.playSounds ? 'On' : 'Off'}</span></li>
                      <li>Timeout: <span class="text-teal-400">{twirl.config.timeout || 'None'}</span></li>
                    </ul>
                  </div>
                  <div>
                    <h4 class="text-sm font-semibold text-slate-400 mb-2">Timeline</h4>
                    <ul class="text-sm text-slate-300 space-y-1">
                      <li>Started: {formatDate(twirl.startedAt)}</li>
                      <li>Ended: {formatDate(twirl.endedAt)}</li>
                      <li>Duration: {formatDuration(twirl.duration)}</li>
                    </ul>
                  </div>
                </div>

                <h4 class="text-sm font-semibold text-slate-400 mb-2">Steps</h4>
                <div class="space-y-2">
                  {#each twirl.steps as step, j}
                    <details class="rounded border border-slate-600 bg-slate-800/50">
                      <summary class="cursor-pointer p-3 hover:bg-slate-700/50 transition-colors text-sm">
                        <span class="font-mono text-teal-400">Step {j + 1}</span>
                        <span class="ml-2 text-slate-300">{step.original.name}</span>
                        <span class="ml-2 text-slate-500">({step.inputs.length} inputs, {step.duration}ms)</span>
                      </summary>
                      <div class="p-3 border-t border-slate-600 bg-slate-900/50">
                        <pre class="text-xs text-slate-300 overflow-auto">{JSON.stringify(step, null, 2)}</pre>
                      </div>
                    </details>
                  {/each}
                </div>
              </div>
            </details>
          {/each}
        {/if}
      </div>
    </section>

    <!-- Input Testing Section -->
    <section>
      <h2 class="text-2xl font-semibold text-slate-300 mb-4">Input Testing</h2>
      <div class="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <p class="text-slate-400">Press any key or gamepad button to test input detection. Check console for details.</p>
      </div>
    </section>
  </div>
</div>