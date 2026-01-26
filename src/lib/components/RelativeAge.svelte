<script lang="ts">
	import { getLocalDateTimeString, getRelativeAge } from "$lib/helpers";

  let { date, class: className, ...props }: { date?: Date | string, [key: string]: any } = $props()
  let relevantDate: Date = $derived(date ? (typeof date === 'string' ? new Date(date) : date) : new Date())
  let age = getRelativeAge(relevantDate)
</script>

<span
  class="underline decoration-dotted cursor-default {className}"
  title={getLocalDateTimeString(relevantDate)}
  {...props}
>
  {age}
</span>
