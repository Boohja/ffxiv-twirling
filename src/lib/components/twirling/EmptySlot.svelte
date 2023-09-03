<script lang="ts">
  import { tick } from 'svelte';
  import Icon from 'svelte-icons-pack/Icon.svelte';
  import CgAddR from 'svelte-icons-pack/cg/CgAddR.js';
  import { createEventDispatcher } from 'svelte';
  import type {JobAction} from "$lib/jobActions";
  import InputModal from "$lib/components/twirling/InputModal.svelte";
  import CgMouse from "svelte-icons-pack/cg/CgMouse";
  import {formatKeybind} from "$lib/helpers";
  import type {RotationStep, RotationStepKey} from '$lib/stores'

  let opened = false
  let propagateKeybind = true
  let refInputModal: any
  let stepIdx = -1
  let inputValue = ''
  let keybindValue: RotationStepKey
  const defaultImage = '/images/skills/unknown.png'
  const defaultImages = [
    '/images/skills/cogs.png',
    '/images/skills/exclamation.png',
    '/images/skills/mouse.png',
    '/images/skills/unknown.png'
  ]
  let imgSrc = '/images/skills/unknown.png'
  export let suggestions: JobAction[]
  const dispatch = createEventDispatcher();

  async function toggleMenu () {
    opened = !opened
  }

  $: canSubmit = inputValue.length > 0

  function checkKey (e: KeyboardEvent) {
    const suggestedHit = suggestions.find(s => s.name === inputValue)
    imgSrc = suggestedHit ? `/images/skills/${suggestedHit.icon}` : defaultImage
    if (e.key !== 'Enter' || inputValue.length < 1) {
      return
    }
    submit()
  }

  function showInputModal () {
    refInputModal.show()
  }

  export function editStep (idx: number, step: RotationStep) {
    stepIdx = idx
    keybindValue = step.key
    imgSrc = step.icon
    inputValue = step.name
  }

  function submit () {
    if (!canSubmit) {
      return
    }
    if (stepIdx > -1) {
      dispatch('updateentry', {
        idx: stepIdx,
        step: {
          name: inputValue,
          icon: imgSrc,
          key: keybindValue
        },
        propagateKeybind
      })
    }
    else {
      dispatch('newentry', {
        step: {
          name: inputValue,
          icon: imgSrc,
          key: keybindValue
        },
        propagateKeybind
      })
    }
    cancel()
  }

  function cancel () {
    inputValue = ''
    imgSrc = defaultImage
    keybindValue = undefined
    stepIdx = -1
  }
</script>

<style>
.edit {
  top: -1px;
  left: 4.5rem;
}
</style>

<div class="flex">
  <div
    class="flex-none relative"
  >
    <img src={imgSrc} alt="" class="w-16 h-16 border border-slate-500 rounded object-cover" on:pointerdown={toggleMenu} />
    <div class="border border-slate-900 absolute -bottom-20 left-0 z-10 bg-slate-500 w-80 shadow-2xl { opened ? '' : 'invisible' }">
      <div class="flex">
        {#each defaultImages as di}
          <img
            src={di}
            alt=""
            class="w-12 h-12 m-2 border border-slate-900 rounded cursor-pointer"
            on:click={() => { imgSrc = di; opened = false }}
            on:keypress={() => { imgSrc = di; opened = false }}
          />
        {/each}
      </div>
    </div>
  </div>
  <div class="edit ml-3">
    Name:<br>
    <input bind:value={inputValue} list="empty-slot-suggestions" on:keyup={checkKey} on:change={checkKey} class="text-slate-900 px-2 py-1" />
    <datalist id="empty-slot-suggestions">
      {#each suggestions as s}
        <option value={s.name} />
      {/each}
    </datalist>
    <div class="mt-3">
      Keybind:<br>
      <div class="mt-3 font-thin bg-opacity-20 bg-black px-3 py-2 inline-block rounded-full cursor-pointer" on:click={showInputModal}>
        <Icon src={CgMouse} className="inline" /> {formatKeybind(keybindValue) }
      </div><br>
      <label>
        <input type="checkbox" class="ml-2 mt-2" bind:checked={propagateKeybind} /> Apply keybind to steps with same name
      </label>
    </div>
  </div>
  <InputModal bind:this={refInputModal} on:keybind={(e) => keybindValue = e.detail} />
</div>
<button class="mt-5 py-3 px-5 bg-teal-700 {canSubmit ? '' : 'opacity-40'} rounded-full text-white font-semibold" on:click={submit}>{stepIdx > -1 ? 'Save' : 'Create'}</button>
{#if stepIdx > -1}
  <button class="mt-5 py-3 px-5 border border-gray-500 rounded-full text-white font-semibold" on:click={cancel}>Cancel</button>
{/if}


<!--  <Icon src={CgAddR} size="2em" />-->
