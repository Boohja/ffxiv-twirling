<script lang="ts">
	import { Icon } from "svelte-icons-pack";
  import { BsMouse2 } from "svelte-icons-pack/bs";

  export let button: number;
  export let size: 'sm' | 'md' | 'lg' = 'md';

  const sizeClasses = {
    sm: 'min-w-[1.5rem] px-1.5 py-1 text-[10px] gap-0.5',
    md: 'min-w-[2rem] px-2 py-1.5 text-xs gap-1',
    lg: 'min-w-[2.5rem] px-3 py-2 text-sm gap-1'
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5'
  };

  const buttonLabels: Record<number, string> = {
    0: 'L',
    1: 'M',
    2: 'R',
    3: 'X1',
    4: 'X2'
  };

  $: label = buttonLabels[button] || `M${button + 1}`;
</script>

<div 
  class="inline-flex items-center justify-center font-semibold text-slate-300 bg-slate-800/50 border-2 border-slate-600/70 rounded {sizeClasses[size]}"
  title="Mouse Button {button + 1}"
>
  <Icon src={BsMouse2} className="{iconSizes[size]} fill-current opacity-60" />
  <span>{label}</span>
</div>
