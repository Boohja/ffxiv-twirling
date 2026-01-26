<script lang="ts">
  import type { KeyboardInput, GamepadInput } from "$lib/stores";
  import { createEventDispatcher } from "svelte";
  import { Icon } from "svelte-icons-pack";
  import { BiMouse, BiCheckCircle, BiXCircle, BiErrorCircle } from "svelte-icons-pack/bi";
  import RecordInput from "./RecordInput.svelte";
	import { getGamepadButtonUrl } from "$lib/iconLoader";

  const dispatch = createEventDispatcher();
  
  let opened = false;
  let recording = false;
  let recordInputComponent: RecordInput;
  let snapshot: KeyboardInput | GamepadInput | undefined = undefined;

  export function show() {
    opened = true;
    snapshot = undefined;
    recording = false;
    // Start recording automatically after component is mounted
    setTimeout(() => {
      startRecording();
    }, 0);
  }
  
  function close() {
    snapshot = undefined;
    recording = false;
    opened = false;
  }
  
  function startRecording() {
    recording = true;
    recordInputComponent?.start();
  }
  
  function handleInput(event: CustomEvent<KeyboardInput | GamepadInput>) {
    snapshot = event.detail;
    recording = false;
  }
  
  function handleCancel() {
    recording = false;
  }

  function submit() {
    if (!snapshot) return;
    dispatch("keybind", snapshot);
    close();
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center rounded-xl justify-center p-4 {opened ? '' : 'hidden'}"
  id="dialog-wrapper"
  role="dialog"
  aria-modal="true"
  aria-labelledby="keybind-title"
>
  <div class="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
    <!-- Header -->
    <div class="flex items-center gap-3 border-b border-slate-700 bg-slate-800/60 px-6 py-4">
      <Icon src={BiMouse} size="1.3em" className="text-teal-400" />
      <h2 id="keybind-title" class="text-lg font-semibold text-slate-100">Record a keybind</h2>
      <div class="ml-auto text-xs text-slate-400 flex items-center gap-1">
        <Icon src={BiErrorCircle} size="1em" />
        <span>Press ESC or <img src={getGamepadButtonUrl('ps', 9)} alt="A" class="inline-block mx-1 opacity-40" /> to cancel</span>
      </div>
    </div>

    <!-- Body -->
    <div class="px-6 py-6">
      <p class="text-sm text-slate-300 mb-3">
        Press keyboard keys, click a mouse button, or press gamepad buttons.
      </p>

      <!-- Recording area -->
      <div class="mb-6">
        <RecordInput 
          bind:this={recordInputComponent}
          on:input={handleInput}
          on:cancel={handleCancel}
          showDevice={true}
          cancellable={true}
        />
      </div>

      <!-- Actions -->
      <div class="grid grid-cols-3 gap-3">
        <button
          class="inline-flex items-center justify-center gap-2 rounded-full border border-slate-600 bg-slate-800 px-5 py-3 text-slate-100 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          on:click={startRecording}
        >
          <Icon src={BiMouse} />
          <span class="whitespace-nowrap">{recording ? 'Recording… (ESC)' : 'Start recording'}</span>
        </button>

        <button
          class="inline-flex items-center justify-center gap-2 rounded-full border border-teal-700 bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 {snapshot ? '' : 'opacity-40 cursor-not-allowed'}"
          on:click={submit}
          disabled={!snapshot}
        >
          <Icon src={BiCheckCircle} />
          <span>Use this</span>
        </button>

        <button
          class="inline-flex items-center justify-center gap-2 rounded-full border border-slate-600 bg-transparent px-5 py-3 text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/50"
          on:click={close}
        >
          <Icon src={BiXCircle} />
          <span>Cancel</span>
        </button>
      </div>
    </div>
  </div>
</div>

<style scoped>
  #dialog-wrapper::before {
    content: '';
    border-radius: 0.75rem;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(10px);
    z-index: -1;
  }
</style>