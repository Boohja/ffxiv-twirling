<script lang="ts">

  type Variant = 'default' | 'highlight'
  let { variant, children, class: className, ...props }: { variant?: Variant, [key: string]: any } = $props()

  const variants = {
    default: 'p-6 border border-slate-700/50 rounded-xl mb-8 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm shadow-xl',
    highlight: 'p-6 border border-slate-700/50 rounded-xl mb-8 bg-gradient-to-br from-teal-900/20 via-slate-800/60 to-slate-900/60 backdrop-blur-sm shadow-xl sticky top-4 self-start'
  }

  let classes = $derived(variants[variant ?? 'default'] + ' ' + (className || ''))
</script>

<div
  class="relative {classes}"
  {...props}
>
  {#if children}
    {@render children()}
  {/if}
</div>
