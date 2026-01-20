<script lang="ts">
  import RecordInput from "$lib/components/twirling/RecordInput.svelte";
  import type { KeyboardInput, GamepadInput } from "$lib/stores";
  import { formatKeybind } from "$lib/helpers";

  let recordedInputs: (KeyboardInput | GamepadInput)[] = [];
  let recordInputComponent: RecordInput;

  function handleInput(event: CustomEvent<KeyboardInput | GamepadInput>) {
    recordedInputs = [...recordedInputs, event.detail];
  }

  function startRecording() {
    recordInputComponent.start();
  }
</script>

<div class="p-4">
  <h1 class="text-2xl font-bold mb-4 text-slate-200">Test RecordInput Component</h1>
  
  <div class="mb-6">
    <h2 class="text-lg font-semibold mb-3 text-slate-300">Record Input:</h2>
    <RecordInput bind:this={recordInputComponent} on:input={handleInput} showDevice={true} />
    <button 
      class="mt-3 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
      on:click={startRecording}
    >
      Start Recording
    </button>
  </div>

  <div>
    <h2 class="text-lg font-semibold mb-3 text-slate-300">Recorded Inputs:</h2>
    <div class="rounded-lg border border-slate-700 bg-slate-900 p-4">
      {#if recordedInputs.length === 0}
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
      {/if}
    </div>
  </div>
</div>