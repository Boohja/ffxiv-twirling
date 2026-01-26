<script lang="ts">
  import { twirls } from '$lib/stores'
  import PageTitle from '$lib/components/page/PageTitle.svelte'
  import { Icon } from 'svelte-icons-pack'
  import { BiTask, BiTrash } from 'svelte-icons-pack/bi'
  import { getJobIconUrls } from '$lib/iconLoader'
	import Container from '$lib/components/form/Container.svelte';
	import { LuClipboardCheck } from 'svelte-icons-pack/lu';
	import { getLocalDateTimeString, getRelativeAge } from '$lib/helpers';
	import RelativeAge from '$lib/components/RelativeAge.svelte';

  const jobIconUrl = getJobIconUrls()

  function formatDate(isoString: string): string {
    return new Date(isoString).toLocaleString()
  }

  function formatDuration(ms: number): string {
    const seconds = (ms / 1000).toFixed(1)
    return `${seconds}s`
  }

  function getAccuracy(twirl: typeof $twirls[0]): number {
    const totalInputs = twirl.steps.reduce((sum, step) => sum + step.inputs.length, 0)
    const correctInputs = twirl.steps.reduce((sum, step) => {
      return sum + step.inputs.filter(input => input.correct).length
    }, 0)
    return totalInputs > 0 ? (correctInputs / totalInputs) * 100 : 0
  }

  function getTotalAttempts(twirl: typeof $twirls[0]): number {
    return twirl.steps.reduce((sum, step) => sum + step.inputs.length, 0)
  }

  function deleteTwirl(index: number) {
    twirls.update(t => {
      const updated = [...t]
      updated.splice(index, 1)
      return updated
    })
  }
</script>

<Container>
  <PageTitle>
    <div class="flex items-center gap-3">
      <Icon src={LuClipboardCheck} size="1.5em" color="#57c5b7" /> Twirl Recordings
    </div>
  </PageTitle>

  {#if $twirls.length === 0}
    <div class="mt-8 rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center">
      <p class="text-slate-400">No twirls recorded yet. Practice a rotation to see your recordings here.</p>
      <a 
        href="/rotations" 
        class="mt-4 inline-block px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg text-sm font-medium transition-colors"
      >
        Go to Rotations
      </a>
    </div>
  {:else}
    <div class="mt-6 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="border-b border-slate-700">
          <tr class="text-left text-slate-400">
            <th class="p-3 font-semibold">#</th>
            <th class="p-3 font-semibold">Rotation</th>
            <th class="p-3 font-semibold">Date</th>
            <th class="p-3 font-semibold">Duration</th>
            <th class="p-3 font-semibold">Inputs</th>
            <th class="p-3 font-semibold">Accuracy</th>
            <th class="p-3 font-semibold">Status</th>
            <th class="p-3 font-semibold"></th>
          </tr>
        </thead>
        <tbody>
          {#each $twirls as twirl, i}
            <tr class="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
              <td class="p-3 text-slate-400">
                <a href="/recordings/{i}" class="hover:text-teal-400 transition-colors">
                  #{i + 1}
                </a>
              </td>
              <td class="p-3 text-slate-200">
                <a href="/rotations/{twirl.rotation.slug}" class="hover:text-teal-400 transition-colors inline-flex items-center gap-2">
                  {#if jobIconUrl[twirl.rotation.job]}
                    <img src={jobIconUrl[twirl.rotation.job]} alt={twirl.rotation.job} class="h-6 w-6 rounded" />
                  {:else}
                    <div class="h-6 w-6 rounded bg-slate-700"></div>
                  {/if}
                  {twirl.rotation.name}
                </a>
              </td>
              <td class="p-3 text-slate-400 text-xs"><RelativeAge date={new Date(twirl.startedAt)} /></td>
              <td class="p-3 text-slate-300 font-mono">{formatDuration(twirl.duration)}</td>
              <td class="p-3 text-slate-300 text-center">{getTotalAttempts(twirl)} / {twirl.steps.length}</td>
              <td class="p-3">
                <div class="flex items-center gap-2">
                  <div class="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      class="h-full transition-all {getAccuracy(twirl) === 100 ? 'bg-green-500' : getAccuracy(twirl) >= 80 ? 'bg-teal-500' : getAccuracy(twirl) >= 60 ? 'bg-yellow-500' : 'bg-red-500'}"
                      style="width: {getAccuracy(twirl)}%"
                    ></div>
                  </div>
                  <span class="text-xs font-mono text-slate-400">{getAccuracy(twirl).toFixed(0)}%</span>
                </div>
              </td>
              <td class="p-3">
                {#if twirl.finished}
                  {#if twirl.correct}
                    <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-900/30 text-green-400 border border-green-800">
                      ✓ Perfect
                    </span>
                  {:else}
                    <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-900/30 text-red-400 border border-red-800">
                      ✗ Errors
                    </span>
                  {/if}
                {:else}
                  <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-700/30 text-slate-400 border border-slate-600">
                    — Skipped
                  </span>
                {/if}
              </td>
              <td class="p-3">
                <div class="flex items-center gap-2">
                  <a 
                    href="/recordings/{i}" 
                    class="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 rounded text-xs font-medium transition-colors"
                  >
                    Details
                  </a>
                  <button
                    on:click={() => deleteTwirl(i)}
                    class="px-2 py-1.5 bg-transparent border border-red-600/50 text-red-400 hover:bg-red-600 hover:border-red-600 hover:text-white rounded text-xs font-medium transition-colors"
                    title="Delete recording"
                  >
                    <Icon src={BiTrash} size="1em" />
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="mt-6 p-4 rounded-lg bg-slate-800/30 border border-slate-700 text-sm text-slate-400">
      <p><strong class="text-slate-300">Total Recordings:</strong> {$twirls.length}</p>
      <p class="mt-1">
        <strong class="text-slate-300">Average Accuracy:</strong> 
        {($twirls.reduce((sum, t) => sum + getAccuracy(t), 0) / $twirls.length).toFixed(1)}%
      </p>
    </div>
  {/if}
  </Container>
