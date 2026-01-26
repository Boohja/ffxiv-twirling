<script lang="ts">

  type Variant = 'primary' | 'secondary' | 'outline-primary' | 'outline-secondary' | 'outline-danger' | 'text'
  let { variant, children, class: className, ...props }: { variant: Variant, [key: string]: any } = $props()

  const variants = {
    primary: 'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 rounded-full text-white font-semibold text-sm shadow-md hover:shadow-teal-500/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:ring-offset-2 focus:ring-offset-slate-900',
    secondary: 'bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 rounded-full text-slate-200 font-semibold text-sm shadow-md hover:shadow-slate-600/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:ring-offset-2 focus:ring-offset-slate-900',
    'outline-primary': 'border border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white rounded-full font-semibold text-sm shadow-md hover:shadow-teal-500/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:ring-offset-2 focus:ring-offset-slate-900',
    'outline-secondary': 'border border-slate-600 text-slate-200 hover:bg-slate-700 rounded-full font-semibold text-sm shadow-md hover:shadow-slate-600/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:ring-offset-2 focus:ring-offset-slate-900',
    'outline-danger': 'border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-full font-semibold text-sm shadow-md hover:shadow-red-500/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:ring-offset-2 focus:ring-offset-slate-900',
    text: 'inline-flex items-center justify-center rounded-lg hover:bg-slate-700/50 hover:text-teal-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50'
  }

  let classes = $derived(variants[variant] + ' ' + (className || ''))
</script>

<a
  class="text-center relative py-2.5 px-6 {classes}"
  {...props}
  role="{props.href ? 'link' : 'button'}"
  onclick={props.onclick}
>
  {#if children}
    {@render children()}
  {/if}
</a>