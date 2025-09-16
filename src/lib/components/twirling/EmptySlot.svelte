<script lang="ts">
  import { tick } from 'svelte';
  import { Icon } from 'svelte-icons-pack';
  import { CgAddR } from 'svelte-icons-pack/cg';
  import { createEventDispatcher } from 'svelte';

  let opened = true
  let refInput: HTMLElement
  let inputValue = ''
  export let suggestions: any[]
  const dispatch = createEventDispatcher();

  async function showMenu () {
    opened = true
    await tick()
    refInput.focus()
  }

  function checkKey (e: KeyboardEvent) {
    if (e.key !== 'Enter' || inputValue.length < 1) {
      return
    }
    dispatch('newentry', {
      name: inputValue
    });
    inputValue = ''
  }
</script>

<style>
.edit {
  top: -1px;
  left: 4.5rem;
}
</style>

<div
  class="border border-slate-500 h-16 w-16 rounded shadow-xl cursor-pointer relative"
  on:pointerdown={showMenu}
>
  <Icon src={CgAddR} size="2em" />
  <div class="edit absolute {opened ? '' : 'invisible'}">
    <input bind:value={inputValue} list="empty-slot-suggestions" bind:this={refInput} on:keydown={checkKey} class="text-slate-900 px-2 py-1" />
    <datalist id="empty-slot-suggestions">
    {#each suggestions as s}
      <option value={s.name} />
    {/each}
    </datalist>
  </div>
</div>