<script lang="ts">
	import Container from "$lib/components/form/Container.svelte";
	import PageTitle from "$lib/components/page/PageTitle.svelte";
	import { onMount } from "svelte";
	import { Icon } from "svelte-icons-pack";
	import { LuDatabase } from "svelte-icons-pack/lu";

  interface StorageEntry {
    name: string;
    size: number;
    link?: string;
  }

  interface StorageGroup {
    title: string;
    url?: string;
    entries: StorageEntry[];
  }

  let storageGroups: StorageGroup[] = [];
  let totalSize = 0;
  const LIMIT_MB = 5;

  function getItemSize(key: string, value: string): number {
    return (key.length + value.length) * 2; // UTF-16 uses 2 bytes per character
  }

  function formatSize(bytes: number): string {
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(2)} KB`;
    }
    return `${(kb / 1024).toFixed(2)} MB`;
  }

  function loadStorageData() {
    const systemEntries: StorageEntry[] = [];
    const rotationEntries: StorageEntry[] = [];
    const twirlEntries: StorageEntry[] = [];

    let systemSize = 0;

    for (let key in localStorage) {
      if (!localStorage.hasOwnProperty(key)) continue;

      const value = localStorage[key];
      const size = getItemSize(key, value);

      if (key === 'rotations') {
        try {
          const rotations = JSON.parse(value);
          for (let idx in rotations) {
            const rotationData = JSON.stringify(rotations[idx]);
            const rotationSize = getItemSize(idx, rotationData);
            rotationEntries.push({
              name: rotations[idx].job?.toUpperCase() + " - " + rotations[idx].name || idx,
              size: rotationSize,
              link: `/rotations/${rotations[idx].slug}`
            });
          }
        } catch (e) {
          console.error('Error parsing rotations:', e);
        }
      }
      else if (key === 'twirls') {
        try {
          const twirls = JSON.parse(value);
          twirls.forEach((twirl: any, idx: number) => {
            const twirlData = JSON.stringify(twirl);
            const twirlSize = getItemSize(idx.toString(), twirlData);
            twirlEntries.push({
              name: twirl.name || `Recording ${idx + 1}`,
              size: twirlSize,
              link: `/recordings/${idx}`
            });
          });
        } catch (e) {
          console.error('Error parsing twirls:', e);
        }
      } else {
        systemSize += size;
      }
    }

    if (systemSize > 0) {
      systemEntries.push({
        name: 'System Data',
        size: systemSize
      });
    }

    storageGroups = [
      { title: 'Rotations', url: '/rotations', entries: rotationEntries },
      { title: 'Recordings', url: '/recordings', entries: twirlEntries },
      { title: 'System Data', entries: systemEntries }
    ];

    totalSize = systemSize + 
      rotationEntries.reduce((sum, e) => sum + e.size, 0) +
      twirlEntries.reduce((sum, e) => sum + e.size, 0);
  }

  onMount(() => {
    loadStorageData();
  });
</script>

<Container>
  <PageTitle>
    <div class="flex items-center gap-3">
      <Icon src={LuDatabase} color="#57c5b7" size="1.5em" /> Storage Information
    </div>
  </PageTitle>

  <p>
    This app stores all data in your browsers localStorage.
  </p>
  <p class="mt-4">
    Sadly we cannot know how much space is available due to browser limitations, so we just assume that you have ~5MB available.
  </p>
</Container>

<Container >
  <div class="overflow-x-auto">
    <table class="min-w-full bg-slate-800 text-slate-200 rounded-lg">
      <thead class="bg-slate-700">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
          <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Size</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-700">
        {#each storageGroups as group}
          {#if group.entries.length > 0}
            <tr class="bg-slate-750">
              <td colspan="2" class="px-6 py-2 text-sm font-semibold text-slate-500 uppercase">
                {#if group.url}
                  <a href={group.url} class="hover:underline">
                    {group.title}
                  </a>
                {:else}
                  {group.title}
                {/if}
              </td>
            </tr>
            {#each group.entries as entry}
              <tr class="hover:bg-slate-700">
                <td class="px-6 py-3">
                  {#if entry.link}
                    <a href={entry.link} class="text-teal-400 hover:text-teal-300 underline">
                      {entry.name}
                    </a>
                  {:else}
                    {entry.name}
                  {/if}
                </td>
                <td class="px-6 py-3 text-right font-mono text-sm">
                  {formatSize(entry.size)}
                </td>
              </tr>
            {/each}
          {/if}
        {/each}
        
        <tr class="bg-slate-900 font-bold border-t-2 border-teal-400">
          <td class="px-6 py-4">
            Total
          </td>
          <td class="px-6 py-4 text-right font-mono">
            {formatSize(totalSize)} / {LIMIT_MB} MB
            <span class="ml-2 text-sm font-normal" class:text-orange-400={totalSize / (LIMIT_MB * 1024 * 1024) > 0.9} class:text-green-400={totalSize / (LIMIT_MB * 1024 * 1024) <= 0.9}>
              ({((totalSize / (LIMIT_MB * 1024 * 1024)) * 100).toFixed(1)}%)
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</Container>