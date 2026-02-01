<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { actionLanguages, type ActionLanguage } from '$lib/types/jobActions'

  let selected = $state(false)
  const dispatch = createEventDispatcher<{ change: ActionLanguage }>()

  let { 
    language = $bindable('en'),
    onchange,
    class: className = '',
    ...props 
  }: { 
    language?: string,
    onchange?: (lang: ActionLanguage) => void,
    class?: string,
    [key: string]: any 
  } = $props()

  const languageNames: Record<ActionLanguage, string> = {
    en: 'English',
    fr: 'Français',
    de: 'Deutsch',
    ja: '日本語'
  }

  function handleSelect(lang: ActionLanguage) {
    language = lang
    selected = false
    onchange?.(lang)
    dispatch('change', lang)
  }

  function toggleDropdown(event: MouseEvent) {
    event.stopPropagation()
    selected = !selected
  }

  function handleClickOutside() {
    selected = false
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="language-selector relative inline-block {className}" {...props}>
  <button
    type="button"
    class="inline-flex items-center justify-center rounded-full hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/50 p-1"
    onclick={toggleDropdown}
    aria-label="Select language"
  >
    <img
      src="/images/language/{language}.webp"
      alt={languageNames[language as ActionLanguage]}
      class="h-8 w-8 rounded"
    />
  </button>

  {#if selected}
    <div class="absolute top-full right-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg min-w-max">
      {#each actionLanguages as lang}
        <button
          type="button"
          class="w-full px-4 py-2 flex items-center gap-2 hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg {lang === language ? 'bg-slate-700' : ''}"
          onclick={() => handleSelect(lang)}
        >
          <img
            src="/images/language/{lang}.webp"
            alt={languageNames[lang]}
            class="h-6 w-6 rounded"
          />
          <span>{languageNames[lang]}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  :global(.language-selector) {
    position: relative;
  }
</style>
