<script lang="ts">
  export let size: 'sm' | 'md' | 'lg' = 'md';

  const sizeClasses = {
    sm: 'min-w-[1.5rem] px-1.5 py-1 text-[10px]',
    md: 'min-w-[2rem] px-2 py-1.5 text-xs',
    lg: 'min-w-[2.5rem] px-3 py-2 text-sm'
  };
</script>

<kbd class="inline-flex items-center justify-center font-thin font-mono text-slate-200 bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600 rounded shadow-sm {sizeClasses[size]}">
  <slot></slot>
</kbd>