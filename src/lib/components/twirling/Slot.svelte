<script lang="ts">
  import Icon from 'svelte-icons-pack/Icon.svelte';
  import CgPen from 'svelte-icons-pack/cg/CgPen.js';
  import CgAddR from 'svelte-icons-pack/cg/CgAddR.js';
  import CgTrash from 'svelte-icons-pack/cg/CgTrash.js';
  import CgChevronUp from 'svelte-icons-pack/cg/CgChevronUp.js';
  import CgChevronDown from 'svelte-icons-pack/cg/CgChevronDown.js';

  function showMenu () {
    console.log('show')
  }

  function hideMenu () {
    console.log('hide')
  }
</script>

<style>
.menu {
  top: -1px;
  left: 4.5rem;
  display: grid;
  grid-template-columns: repeat(3, 5em);
  align-items: center;
  justify-items: center;
}
.edit {
  top: -1px;
  left: 4.5rem;
}
</style>

<div
  class="border border-slate-500 h-16 w-16 rounded shadow-xl cursor-pointer relative"
  on:pointerenter={showMenu}
  on:pointerleave={hideMenu}
>
  <Icon src={CgAddR} size="2em" />
  <div class="menu absolute border border-slate-500 rounded h-16 invisible">
    <div>
      <div class="menu-button"><Icon src={CgChevronUp} /></div>
      <div class="menu-button"><Icon src={CgChevronDown} /></div>
    </div>
    <div class="menu-button">
      <Icon src={CgPen} />
    </div>
    <div class="menu-button">
      <Icon src={CgTrash} /> 
    </div>
  </div>
  <div class="edit absolute border border-slate-500 rounded h-16">
    <input type="text" />
    Or pick from right side
  </div>
</div>