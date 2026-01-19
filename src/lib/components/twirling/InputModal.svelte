<script lang="ts">
  import type { RotationStepKey } from "$lib/stores";
  import { deriveKeyName, formatKeybind, isModifierKey } from "$lib/helpers";
  import { createEventDispatcher } from "svelte";
  import { Icon } from "svelte-icons-pack";
  import { BiMouse, BiMicrophone, BiCheckCircle, BiXCircle, BiErrorCircle } from "svelte-icons-pack/bi";

  const dispatch = createEventDispatcher();
  let opened = false;
  let recording = false;
  let hasSnapshot = false;
  let shift = false;
  let alt = false;
  let ctrl = false;
  let mouse: false | number = false;
  let keyCode = "";
  let keyName = "";
  const defaultSnapshot = (): RotationStepKey => ({ shift: false, ctrl: false, alt: false, mouse: false, keyCode: "", keyName: "" });
  let snapshot: RotationStepKey = defaultSnapshot();

  export function show() {
    opened = true;
    startRecording();
  }
  function close() {
    stopRecording();
  hasSnapshot = false;
  snapshot = defaultSnapshot();
    opened = false;
  }
  function handleEvent(e: KeyboardEvent | MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    console.log(e.type)
    if (e.type === "keydown" || e.type === "keyup") {
      const ke = e as KeyboardEvent;
      shift = ke.shiftKey;
      alt = ke.altKey;
      ctrl = ke.ctrlKey;
      if (ke.code === "Escape") {
        stopRecording();
      } else if (!isModifierKey(ke.key)) {
        keyCode = ke.code;
        keyName = deriveKeyName(ke.key, ke.code);
        makeSnapshot();
        stopRecording();
      }
    } else if (e.type === "mouseup") {
      const me = e as MouseEvent;
      mouse = me.button;
      makeSnapshot();
      stopRecording();
    }
    return false;
  }

  function makeSnapshot() {
    hasSnapshot = true;
    snapshot = {
      shift,
      alt,
      ctrl,
      mouse,
      keyCode,
      keyName,
    };
  }

  function startRecording() {
    recording = true;
  snapshot = defaultSnapshot();
    hasSnapshot = false;

    window.addEventListener("keydown", handleEvent);
    window.addEventListener("keyup", handleEvent);
    window.addEventListener("mouseup", handleEvent);
    window.addEventListener("contextmenu", handleEvent);
  }

  function stopRecording() {
    recording = false;
    window.removeEventListener("keydown", handleEvent);
    window.removeEventListener("keyup", handleEvent);
    window.removeEventListener("mouseup", handleEvent);
    window.removeEventListener("contextmenu", handleEvent);

    shift = false;
    alt = false;
    ctrl = false;
    mouse = false;
    keyCode = "";
    keyName = "";
  }

  function submit() {
    if (!hasSnapshot || recording) return;
    dispatch("keybind", snapshot);
    close();
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 {opened ? '' : 'hidden'}"
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
        <span>Press ESC to cancel recording</span>
      </div>
    </div>

    <!-- Body -->
    <div class="px-6 py-6">
      <p class="text-sm text-slate-300 mb-3">Press the desired keys or click a mouse button. We'll capture the combination.</p>

      <!-- Live status panel -->
      <div class="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-4 text-center">
        {#if !recording && !hasSnapshot}
          <div class="text-slate-400">Nothing yet.</div>
        {:else if recording && !ctrl && !shift && !alt && !keyName && mouse === false}
          <div class="flex items-center justify-center gap-3 text-slate-300">
            <span class="relative flex h-4 w-4">
              <span class="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-70 animate-ping"></span>
              <span class="relative inline-flex h-4 w-4 rounded-full bg-teal-500"></span>
            </span>
            <span class="font-medium">Recording… press keys or click</span>
          </div>
        {:else if !recording && hasSnapshot}
          <div class="text-teal-300 font-semibold">{formatKeybind(snapshot)}</div>
        {/if}

        <!-- Visual chips -->
        <div class="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm">
          {#if ctrl}<kbd class="rounded bg-slate-700 px-2 py-1 text-slate-200">Ctrl</kbd>{/if}
          {#if shift}<kbd class="rounded bg-slate-700 px-2 py-1 text-slate-200">Shift</kbd>{/if}
          {#if alt}<kbd class="rounded bg-slate-700 px-2 py-1 text-slate-200">Alt</kbd>{/if}
          {#if keyName}<kbd class="rounded bg-slate-700 px-2 py-1 text-slate-200">{keyName}</kbd>{/if}
          {#if mouse !== false}
            <span class="inline-flex items-center gap-1 rounded bg-slate-700 px-2 py-1 text-slate-200">Mouse{mouse + 1}</span>
          {/if}
        </div>
      </div>

      <!-- Actions -->
      <div class="grid grid-cols-3 gap-3">
        <button
          class="inline-flex items-center justify-center gap-2 rounded-full border border-slate-600 bg-slate-800 px-5 py-3 text-slate-100 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          on:click={startRecording}
        >
          <Icon src={BiMicrophone} />
          <span class="whitespace-nowrap">{recording ? 'Recording… (ESC)' : 'Start recording'}</span>
        </button>

        <button
          class="inline-flex items-center justify-center gap-2 rounded-full border border-teal-700 bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 {hasSnapshot ? '' : 'opacity-40 cursor-not-allowed'}"
          on:click={submit}
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