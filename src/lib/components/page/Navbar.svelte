<script lang="ts">
  import { page } from '$app/stores';
  import logo from '$lib/assets/ffxiv-twirling.svg'
	import { getLocalStorageSize, STORAGE_MAX } from '$lib/helpers';
	import { onMount } from 'svelte';
	import { Icon } from 'svelte-icons-pack';
  import { RiSystemProgress1Line, RiSystemProgress2Line, RiSystemProgress3Line, RiSystemProgress4Line, RiSystemProgress5Line, RiSystemProgress6Line, RiSystemProgress7Line, RiSystemProgress8Line  } from "svelte-icons-pack/ri";

  let storageLines = 1;
  $: storageWarning = false;
  $: storageSize = 0;
  $: storageSizeMB = 0;
  // 6 icons to visualize storage usage, 1 to 6
  $: storageIcon = () => { 
    return storageLevels[storageLines as keyof typeof storageLevels]?.icon || RiSystemProgress1Line;
  };

  const storageLevels = {
    1: { icon: RiSystemProgress1Line },
    2: { icon: RiSystemProgress2Line },
    3: { icon: RiSystemProgress3Line },
    4: { icon: RiSystemProgress4Line },
    5: { icon: RiSystemProgress5Line },
    6: { icon: RiSystemProgress6Line },
    7: { icon: RiSystemProgress7Line },
    8: { icon: RiSystemProgress8Line }
  }

  $: currentPath = $page.url.pathname;
  
  $: isActive = (path: string): boolean => {
    if (path === '/rotations' && currentPath.startsWith('/template')) {
      return true;
    }
    return currentPath.startsWith(path);
  };

  $: getLinkClass = (path: string): string => {
    return `block py-2 pl-3 pr-4 ${isActive(path) ? 'text-teal-400 font-bold' : 'text-slate-400'}`;
  };

  function checkStorageUsage() {
    storageSize = getLocalStorageSize();
    storageSizeMB = storageSize / (1024 * 1024);
    const usage = storageSize / STORAGE_MAX;
    storageWarning = usage >= 0.9;
    storageLines = Math.ceil(usage * 8);
  }

  onMount(() => {
    checkStorageUsage();
    const interval = setInterval(checkStorageUsage, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  });
</script>

<nav id="navbar" class="bg-slate-900 dark:bg-gray-900 mb-6 z-50 fixed w-full top-0 left-0">
  {#if storageWarning}
    <a class="block bg-orange-600 text-white py-2 px-4 text-center text-sm hover:underline" href="/storage">
      ⚠️ Storage Warning: localStorage is at {storageSizeMB.toFixed(2)}MB. Consider clearing old recordings.
    </a>
  {/if}
  <div class="container mx-auto flex flex-wrap items-center justify-between">
    <a href="/" class="flex items-center">
      <img src={logo} alt="fxiv-twirling" class="h-5 mr-3 sm:h-7" />
      <span class="self-center text-2xl font-normal whitespace-nowrap text-teal-400 tracking-wider">
        <span class="text-slate-200 font-light">FFXIV</span>TWIRLING
      </span>
    </a>
    <!-- <button data-collapse-toggle="navbar-default" type="button" class="inline-flex items-center p-2 ml-3 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-default" aria-expanded="false">
      <span class="sr-only">Open main menu</span>
      <svg class="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path></svg>
    </button> -->
    <div class="hidden w-full md:block md:w-auto" id="navbar-default">
      <ul class="flex flex-col p-4 mt-4 border md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-medium md:border-0">
        <li>
          <a 
            href="/rotations" 
            class={getLinkClass('/rotations')}
            aria-current={isActive('/rotations') ? 'page' : undefined}
          >
            Rotations
          </a>
        </li>
        <li>
          <a 
            href="/recordings" 
            class={getLinkClass('/recordings')}
            aria-current={isActive('/recordings') ? 'page' : undefined}
          >
            Recordings
          </a>
        </li>
        <li>
          <a 
            href="/gamepad" 
            class={getLinkClass('/gamepad')}
            aria-current={isActive('/gamepad') ? 'page' : undefined}
          >
            Gamepad
          </a>
        </li>
        <li>
          <a 
            href="/storage" 
            aria-current={isActive('/storage') ? 'page' : undefined}
          >
            <Icon src={storageIcon()} size="1.5em" color="{isActive('/storage') ? '#2dd4bf' : '#94a3b8'}" className="mt-2" title={`Storage usage ~${storageSizeMB.toFixed(2)}MB`} />
          </a>
        </li>
      </ul>
    </div>
  </div>
</nav>

<style scoped>
#navbar {
  box-shadow: 1px 3px 5px 0px rgba(0,0,0,0.75);
}
</style>