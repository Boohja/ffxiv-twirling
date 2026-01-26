<script lang="ts">
  import { goto } from '$app/navigation'
  import { Icon } from 'svelte-icons-pack'
  import { LuKeyboard, LuBrain, LuShield, LuDatabase, LuClock, LuDownload, LuSparkles, LuZap, LuSprout, LuGamepad2 } from 'svelte-icons-pack/lu'
  import Button from '$lib/components/form/Button.svelte'
  import { Jobs, JobsByRole } from '$lib/jobs'
  import { getJobIconUrls } from '$lib/iconLoader'
  import { fade, fly, scale } from 'svelte/transition'
  import { onMount } from 'svelte'

  const jobIconUrl = getJobIconUrls()
  let mounted = false

  onMount(() => {
    mounted = true
  })
</script>

<svelte:head>
  <title>FFXIV Twirling - Practice Your Job Rotations Anywhere</title>
</svelte:head>

<style>
  .hero-glow {
    text-shadow: 0 0 40px rgba(20, 184, 166, 0.5), 0 0 80px rgba(20, 184, 166, 0.2);
  }

  .feature-card {
    backdrop-filter: blur(10px);
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .feature-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px var(--glow-color);
  }

  .feature-card-teal { --glow-color: rgba(20, 184, 166, 0.4); }
  .feature-card-blue { --glow-color: rgba(59, 130, 246, 0.4); }
  .feature-card-green { --glow-color: rgba(34, 197, 94, 0.4); }
  .feature-card-purple { --glow-color: rgba(168, 85, 247, 0.4); }
  .feature-card-pink { --glow-color: rgba(236, 72, 153, 0.4); }
  .feature-card-yellow { --glow-color: rgba(234, 179, 8, 0.4); }

  .gradient-border {
    position: relative;
    background: linear-gradient(135deg, rgba(20, 184, 166, 0.1), rgba(59, 130, 246, 0.1));
    border: 2px solid transparent;
    background-clip: padding-box;
  }

  .gradient-border::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 2px;
    background: linear-gradient(135deg, #14b8a6, #3b82f6, #a855f7);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    opacity: 0.3;
    transition: opacity 0.3s;
  }

  .gradient-border:hover::before {
    opacity: 1;
    background: linear-gradient(135deg, #a855f7, #3b82f6, #14b8a6);
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }

  .float-animation {
    animation: float 6s ease-in-out infinite;
  }

  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(20, 184, 166, 0.4); }
    50% { box-shadow: 0 0 40px rgba(20, 184, 166, 0.8), 0 0 60px rgba(59, 130, 246, 0.4); }
  }

  .pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }

  .job-icon-card {
    transition: all 0.3s ease;
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);
  }

  .job-icon-card:hover {
    transform: scale(1.1) rotate(5deg);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  .usecase-card {
    background: linear-gradient(90deg, rgba(20, 184, 166, 0.05), rgba(59, 130, 246, 0.05));
    border-left: 4px solid transparent;
    background-origin: border-box;
    background-clip: padding-box, border-box;
    transition: all 0.3s ease;
  }

  .usecase-card:hover {
    background: linear-gradient(90deg, rgba(20, 184, 166, 0.15), rgba(59, 130, 246, 0.15));
    border-left-color: #14b8a6;
    transform: translateX(10px);
  }
</style>

<div class="py-12 relative overflow-hidden">
  <!-- Animated Background Elements -->
  <div class="absolute top-20 left-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl"></div>
  <div class="absolute top-40 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
  <div class="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>

  <!-- Hero Section -->
  <section class="text-center mb-20 relative z-10 min-h-[600px] md:min-h-[700px]">
    {#if mounted}
      <div class="mb-8" in:fly={{ y: -50, duration: 800, delay: 100 }}>
        
        <h1 class="text-5xl md:text-7xl font-bold pb-10 tracking-tight hero-glow bg-gradient-to-r from-teal-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
          FFXIV Twirling
        </h1>
        <p class="text-2xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-slate-200 via-teal-200 to-slate-200 bg-clip-text text-transparent">
          Master Your Rotation,<br class="md:hidden" /> Warrior of Light
        </p>
        <p class="text-lg text-slate-300 max-w-2xl mx-auto mt-6 leading-relaxed">
          Practice your job-specific rotations and keybinds anywhere, anytime.<br />
          <span class="text-teal-400 font-semibold">No game required.</span> Just your browser and muscle memory.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12" in:scale={{ duration: 600, delay: 400 }}>
        <Button href="/rotations" variant="primary" class="text-lg px-8 py-3 pulse-glow">
          <Icon src={LuZap} size="20" className="inline mr-2" />
          Start Practicing
        </Button>
      </div>

      <!-- Screenshot Placeholder -->
      <div class="max-w-4xl mx-auto mt-12 rounded-xl overflow-hidden gradient-border shadow-2xl float-animation" in:fade={{ duration: 800, delay: 600 }}>
        <div class="aspect-video flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800">
          <img src="/images/landing/editor.png" alt="FFXIV Twirling Editor Screenshot" class="w-full h-full object-fill" />
        </div>
      </div>
    {/if}
  </section>

  <!-- Important Disclaimer -->
  <section class="mb-20 max-w-3xl mx-auto relative z-10">
    <div class="bg-gradient-to-r from-orange-500/20 via-red-500/20 to-pink-500/20 border-2 border-orange-500/50 rounded-xl p-6 shadow-lg shadow-orange-500/20 backdrop-blur-sm">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 mt-1 bg-orange-500/20 p-2 rounded-lg">
          <Icon src={LuClock} size="28" className="text-orange-400" />
        </div>
        <div>
          <h3 class="text-2xl font-bold text-orange-300 mb-3 flex items-center gap-2">
            What This Is NOT
            <span class="text-orange-500 animate-pulse">⚠️</span>
          </h3>
          <p class="text-white mb-3 font-medium">
            This is <strong class="text-orange-200">not</strong> a game simulation. No cooldowns, no combo conditions, no GCDs, no potencies...
          </p>
          <p class="text-slate-200 leading-relaxed">
            This tool is purely for practicing <strong class="text-teal-300">keybind sequences</strong> and building muscle memory for your rotation order.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Grid -->
  <section class="mb-20 relative z-10">
    <h2 class="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
      Why Use Twirling?
    </h2>
    <p class="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
      Everything you need to master your keybinds and rotations, right in your browser
    </p>
    
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-5">
      <!-- Feature 1 -->
      <a class="feature-card feature-card-teal rounded-xl p-6 border border-teal-500/20" href="/rotations">
        <div class="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-teal-500/20">
          <Icon src={LuKeyboard} size="28" className="text-teal-400" />
        </div>
        <h3 class="text-xl font-bold text-white mb-3">Keybind Practice</h3>
        <p class="text-slate-300 leading-relaxed">
          Focus purely on memorizing your keybind sequences. Perfect for when you've changed your hotbar layout or learning a new job.
        </p>
      </a>

      <!-- Feature 2 -->
      <a class="feature-card feature-card-blue rounded-xl p-6 border border-blue-500/20" href="#jobs">
        <div class="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
          <Icon src={LuShield} size="28" className="text-blue-400" />
        </div>
        <h3 class="text-xl font-bold text-white mb-3">All 20 Jobs</h3>
        <p class="text-slate-300 leading-relaxed">
          Practice with any job - Tanks, Healers, Melee DPS, and Ranged DPS. Updated with current action data.
        </p>
      </a>

      <!-- Feature 3 -->
      <a class="feature-card feature-card-green rounded-xl p-6 border border-green-500/20" href="/storage">
        <div class="bg-gradient-to-br from-green-500/20 to-emerald-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/20">
          <Icon src={LuDatabase} size="28" className="text-green-400" />
        </div>
        <h3 class="text-xl font-bold text-white mb-3">No Account Required</h3>
        <p class="text-slate-300 leading-relaxed">
          Everything runs in your browser. No registration, no login, no server. Your rotations are stored locally.
        </p>
      </a>

      <!-- Feature 4 -->
      <a class="feature-card feature-card-purple rounded-xl p-6 border border-purple-500/20" href="/recordings">
        <div class="bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
          <Icon src={LuBrain} size="28" className="text-purple-400" />
        </div>
        <h3 class="text-xl font-bold text-white mb-3">Record & Analyze</h3>
        <p class="text-slate-300 leading-relaxed">
          Record your practice sessions and analyze your performance. See where you hesitate or make mistakes.
        </p>
      </a>

      <!-- Feature 5 -->
      <a class="feature-card feature-card-pink rounded-xl p-6 border border-pink-500/20" href="/template">
        <div class="bg-gradient-to-br from-pink-500/20 to-rose-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-pink-500/20">
          <Icon src={LuSprout} size="28" className="text-pink-400" />
        </div>
        <h3 class="text-xl font-bold text-white mb-3">Start with Templates</h3>
        <p class="text-slate-300 leading-relaxed">
          Start with pre-made rotation templates or create your own. Copy and adjust to match your playstyle.
        </p>
      </a>

      <!-- Feature 6 -->
      <a class="feature-card feature-card-yellow rounded-xl p-6 border border-yellow-500/20" href="/gamepad">
        <div class="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-yellow-500/20">
          <Icon src={LuGamepad2} size="28" className="text-yellow-400" />
        </div>
        <h3 class="text-xl font-bold text-white mb-3">Gamepad Support</h3>
        <p class="text-slate-300 leading-relaxed">
          Practice with keyboard or gamepad. Test your controller bindings before jumping into content.
        </p>
      </a>
    </div>
  </section>

  <!-- Use Cases -->
  <section class="mb-20 max-w-3xl mx-auto relative z-10">
    <h2 class="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
      Perfect For...
    </h2>
    <p class="text-center text-slate-400 mb-10">
      Whether you're learning, relearning, or preparing for challenging content
    </p>
    
    <div class="space-y-4">
      <div class="usecase-card rounded-xl p-5 border border-teal-500/20 backdrop-blur-sm">
        <p class="text-white text-lg">
          <span class="text-2xl mr-3">✨</span>
          <strong class="text-teal-300">Learning a new job</strong> and getting familiar with the action sequence
        </p>
      </div>
      <div class="usecase-card rounded-xl p-5 border border-blue-500/20 backdrop-blur-sm">
        <p class="text-white text-lg">
          <span class="text-2xl mr-3">🔄</span>
          <strong class="text-blue-300">Changed your hotbars?</strong> Retrain your muscle memory for new keybinds
        </p>
      </div>
      <div class="usecase-card rounded-xl p-5 border border-purple-500/20 backdrop-blur-sm">
        <p class="text-white text-lg">
          <span class="text-2xl mr-3">💼</span>
          <strong class="text-purple-300">Away from your gaming PC?</strong> Practice during breaks or on the go
        </p>
      </div>
      <div class="usecase-card rounded-xl p-5 border border-pink-500/20 backdrop-blur-sm">
        <p class="text-white text-lg">
          <span class="text-2xl mr-3">📚</span>
          <strong class="text-pink-300">Preparing for harder content</strong> and want the rotation ingrained
        </p>
      </div>
    </div>
  </section>

  <!-- Job Grid Preview -->
  <section class="mb-20 relative z-10">
<a id="jobs" aria-label="Jobs Section"></a>
    <h2 class="text-4xl font-bold text-center mb-10 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
      Choose Your Job
    </h2>
    
    {#each JobsByRole as role, i}
      <div class="mb-10 px-4">
        <h3 class="text-xl font-bold text-slate-200 mb-5 flex items-center justify-center gap-3">
          {#if role.id === 'tank'}
            <span class="w-4 h-4 rounded-full shadow-lg bg-blue-500 shadow-blue-500/50"></span>
          {:else if role.id === 'heal'}
            <span class="w-4 h-4 rounded-full shadow-lg bg-green-500 shadow-green-500/50"></span>
          {:else}
            <span class="w-4 h-4 rounded-full shadow-lg bg-red-500 shadow-red-500/50"></span>
          {/if}
          {role.name}
        </h3>
        <div class="flex flex-wrap justify-center gap-6">
          {#each role.jobs as job, j}
            <a 
              href="/rotations?job={job.id}"
              class="job-icon-card rounded-xl p-4 border border-slate-600/30 flex flex-col items-center gap-3 group w-[120px]"
              style="animation-delay: {i * 100 + j * 50}ms"
            >
              <div class="relative">
                <img 
                  src={jobIconUrl[job.id]} 
                  alt={job.name}
                  class="w-14 h-14 rounded-lg group-hover:shadow-lg group-hover:shadow-teal-500/50 transition-all"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-teal-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
              </div>
              <span class="text-sm text-slate-400 group-hover:text-teal-300 transition-colors text-center font-medium">
                {job.name}
              </span>
            </a>
          {/each}
        </div>
      </div>
    {/each}
  </section>

  <!-- CTA Section -->
  <section class="text-center py-20 relative overflow-hidden rounded-2xl">
    <!-- Gradient background -->
    <div class="absolute inset-0 bg-gradient-to-r from-teal-600/20 via-blue-600/20 to-purple-600/20"></div>
    <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/50"></div>
    
    <!-- Animated orbs -->
    <div class="absolute top-0 left-1/4 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl"></div>
    <div class="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
    
    <div class="relative z-10">
      <h2 class="text-5xl font-bold mb-6 bg-gradient-to-r from-teal-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
        Ready to Practice?
      </h2>
      <p class="text-xl text-slate-200 mb-10 max-w-2xl mx-auto leading-relaxed">
        No downloads, no installation, no account.<br />
        Just open your browser and start building that muscle memory.
      </p>
      <Button href="/rotations" variant="primary" class="text-xl px-12 py-5 pulse-glow">
        <Icon src={LuZap} size="24" className="inline mr-2" />
        Start Practicing Now
      </Button>
    </div>
  </section>
</div>