<script lang="ts">
	import { Icon } from 'svelte-icons-pack';
	import {
		LuKeyboard,
		LuBrain,
		LuShield,
		LuDatabase,
		LuClock,
		LuZap,
		LuSprout,
		LuGamepad2
	} from 'svelte-icons-pack/lu';
	import Button from '$lib/components/form/Button.svelte';
	import { JobsByRole } from '$lib/types/jobs';
	import { getJobIconUrls } from '$lib/iconLoader';
	import { fade, fly, scale } from 'svelte/transition';

	const jobIconUrl = getJobIconUrls();
</script>

<svelte:head>
	<title>FFXIV Twirling - Practice Your Job Rotations Anywhere</title>
</svelte:head>

<div class="py-12 relative overflow-hidden">
	<!-- Hero Section -->
	<section class="text-center mb-20 relative z-10 min-h-[560px] md:min-h-[680px]">
		<div class="mb-8" in:fly={{ y: -18, duration: 450, delay: 80 }}>
			<img
				src="/ffxiv-twirling.svg"
				alt="FFXIV Twirling Logo"
				class="w-24 md:w-36 mx-auto mb-8 logo-glow"
			/>
			<h1 class="text-4xl md:text-6xl font-semibold text-[#a5f4e6] tracking-tight">
				Master Your Rotation,<br class="md:hidden" /> Warrior of Light
			</h1>
			<p class="text-lg text-slate-300 max-w-2xl mx-auto mt-6 leading-relaxed text-pretty">
				Practice your job-specific rotations and keybinds anywhere, anytime.<br />
				<span class="text-teal-400 font-semibold">No game required.</span> Just your browser and muscle
				memory.
			</p>
		</div>

		<div
			class="flex flex-col sm:flex-row gap-4 justify-center items-center my-12"
			in:scale={{ duration: 320, delay: 220 }}
		>
			<Button href="/rotations" variant="primary" class="text-lg px-8 py-3">
				<Icon src={LuZap} size="20" className="inline mr-2" />
				Start Practicing
			</Button>
		</div>

		<!-- Screenshot Placeholder -->
		<div
			class="max-w-4xl mx-auto mt-16 rounded-xl overflow-hidden gradient-border shadow-lg shadow-slate-950/30"
			in:fade={{ duration: 420, delay: 320 }}
		>
			<div class="aspect-video flex items-center justify-center bg-slate-900">
				<img
					src="/images/landing/editor.png"
					alt="FFXIV Twirling Editor Screenshot"
					class="w-full h-full object-fill"
				/>
			</div>
		</div>
	</section>

	<!-- Important Disclaimer -->
	<section class="mb-20 max-w-3xl mx-auto relative z-10">
		<div class="bg-slate-900/55 border border-teal-500/20 rounded-xl p-6">
			<div class="flex items-start gap-4">
				<div class="flex-shrink-0 mt-1 bg-teal-500/10 p-2 rounded-lg">
					<Icon src={LuClock} size="28" className="text-teal-300" />
				</div>
				<div>
					<h3 class="text-2xl font-semibold text-[#a5f4e6] mb-3">Built for muscle memory</h3>
					<p class="text-slate-200 mb-3 font-medium">
						Twirling trains <strong class="text-teal-300">keybind order and rotation recall</strong
						>, not full combat simulation.
					</p>
					<p class="text-slate-200 leading-relaxed">
						No cooldowns, combo conditions, GCD timing, or potency math. Just the sequence you want
						your hands to remember.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Features Grid -->
	<section class="mb-20 relative z-10">
		<h2 class="text-4xl font-semibold text-center mb-4 text-[#a5f4e6]">Why Use Twirling?</h2>
		<p class="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
			Everything you need to master your keybinds and rotations, right in your browser
		</p>

		<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-5">
			<!-- Feature 1 -->
			<a class="feature-card rounded-xl p-6 border border-slate-700/60" href="/rotations">
				<div class="bg-teal-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
					<Icon src={LuKeyboard} size="28" className="text-teal-400" />
				</div>
				<h3 class="text-xl font-bold text-white mb-3">Keybind Practice</h3>
				<p class="text-slate-300 leading-relaxed">
					Focus purely on memorizing your keybind sequences. Perfect for when you've changed your
					hotbar layout or learning a new job.
				</p>
			</a>

			<!-- Feature 2 -->
			<a class="feature-card rounded-xl p-6 border border-slate-700/60" href="#jobs">
				<div class="bg-sky-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
					<Icon src={LuShield} size="28" className="text-sky-300" />
				</div>
				<h3 class="text-xl font-bold text-white mb-3">Job-Specific Practice</h3>
				<p class="text-slate-300 leading-relaxed">
					Practice by role and job - Tanks, Healers, Melee DPS, and Ranged DPS. Updated with current
					action data.
				</p>
			</a>

			<!-- Feature 3 -->
			<a class="feature-card rounded-xl p-6 border border-slate-700/60" href="/storage">
				<div class="bg-emerald-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
					<Icon src={LuDatabase} size="28" className="text-emerald-300" />
				</div>
				<h3 class="text-xl font-bold text-white mb-3">No Account Required</h3>
				<p class="text-slate-300 leading-relaxed">
					Everything runs in your browser. No registration, no login, no server. Your rotations are
					stored locally.
				</p>
			</a>

			<!-- Feature 4 -->
			<a class="feature-card rounded-xl p-6 border border-slate-700/60" href="/recordings">
				<div class="bg-violet-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
					<Icon src={LuBrain} size="28" className="text-violet-300" />
				</div>
				<h3 class="text-xl font-bold text-white mb-3">Record & Analyze</h3>
				<p class="text-slate-300 leading-relaxed">
					Record your practice sessions and analyze your performance. See where you hesitate or make
					mistakes.
				</p>
			</a>

			<!-- Feature 5 -->
			<a class="feature-card rounded-xl p-6 border border-slate-700/60" href="/template">
				<div class="bg-rose-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
					<Icon src={LuSprout} size="28" className="text-rose-300" />
				</div>
				<h3 class="text-xl font-bold text-white mb-3">Start with Templates</h3>
				<p class="text-slate-300 leading-relaxed">
					Start with pre-made rotation templates or create your own. Copy and adjust to match your
					playstyle.
				</p>
			</a>

			<!-- Feature 6 -->
			<a class="feature-card rounded-xl p-6 border border-slate-700/60" href="/gamepad">
				<div class="bg-amber-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
					<Icon src={LuGamepad2} size="28" className="text-amber-300" />
				</div>
				<h3 class="text-xl font-bold text-white mb-3">Gamepad Support</h3>
				<p class="text-slate-300 leading-relaxed">
					Practice with keyboard or gamepad. Test your controller bindings before jumping into
					content.
				</p>
			</a>
		</div>
	</section>

	<!-- Use Cases -->
	<section class="mb-20 max-w-3xl mx-auto relative z-10">
		<h2 class="text-4xl font-semibold text-center mb-4 text-[#a5f4e6]">Perfect For...</h2>
		<p class="text-center text-slate-400 mb-10">
			Whether you're learning, relearning, or adjusting your setup
		</p>

		<div class="space-y-4">
			<div class="usecase-card rounded-xl p-5 border border-slate-700/60">
				<p class="text-white text-lg">
					<strong class="text-teal-300">Learning a new job</strong> and getting familiar with the action
					sequence
				</p>
			</div>
			<div class="usecase-card rounded-xl p-5 border border-slate-700/60">
				<p class="text-white text-lg">
					<strong class="text-blue-300">Changed your hotbars?</strong> Retrain your muscle memory for
					new keybinds
				</p>
			</div>
			<div class="usecase-card rounded-xl p-5 border border-slate-700/60">
				<p class="text-white text-lg">
					<strong class="text-purple-300">Away from your gaming PC?</strong> Practice during breaks or
					on the go
				</p>
			</div>
		</div>
	</section>

	<!-- Job Grid Preview -->
	<section class="mb-20 relative z-10">
		<a id="jobs" aria-label="Jobs Section"></a>
		<h2 class="text-4xl font-semibold text-center mb-10 text-[#a5f4e6]">Choose Your Job</h2>

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
								<div
									class="absolute inset-0 bg-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
								></div>
							</div>
							<span
								class="text-sm text-slate-400 group-hover:text-teal-300 transition-colors text-center font-medium"
							>
								{job.name}
							</span>
						</a>
					{/each}
				</div>
			</div>
		{/each}
	</section>

	<!-- CTA Section -->
	<section
		class="text-center py-20 relative overflow-hidden rounded-2xl bg-slate-900/65 border border-teal-500/15"
	>
		<div class="relative z-10">
			<h2 class="text-4xl md:text-5xl font-semibold mb-6 text-[#a5f4e6]">Ready to Practice?</h2>
			<p class="text-xl text-slate-200 mb-10 max-w-2xl mx-auto leading-relaxed">
				No downloads, no installation, no account.<br />
				Just open your browser and start building that muscle memory.
			</p>
			<Button href="/rotations" variant="primary" class="text-xl px-12 py-5">
				<Icon src={LuZap} size="24" className="inline mr-2" />
				Start Practicing Now
			</Button>
		</div>
	</section>
</div>

<style>
	.logo-glow {
		animation: logo-load-twirl 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.25s both;
		filter: drop-shadow(0 0 6px rgba(38, 181, 247, 0.6))
			drop-shadow(0 0 20px rgba(248, 254, 255, 0.1));
		cursor: pointer;
	}

	.logo-glow:hover {
		animation: logo-hover-twirl 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) both;
	}

	@keyframes logo-load-twirl {
		0% {
			transform: rotateY(0deg) rotate(0deg) scale(1);
			filter: drop-shadow(0 0 6px rgba(38, 181, 247, 0.6))
				drop-shadow(0 0 20px rgba(248, 254, 255, 0.1));
		}
		15% {
			transform: rotateY(90deg) rotate(-15deg) scale(1.1);
			filter: drop-shadow(0 0 15px rgba(20, 184, 166, 0.8))
				drop-shadow(0 0 30px rgba(248, 254, 255, 0.3));
		}
		30% {
			transform: rotateY(180deg) rotate(10deg) scale(1.05);
			filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.8))
				drop-shadow(0 0 40px rgba(248, 254, 255, 0.4));
		}
		45% {
			transform: rotateY(270deg) rotate(-10deg) scale(1.15);
			filter: drop-shadow(0 0 25px rgba(59, 130, 246, 0.9))
				drop-shadow(0 0 50px rgba(248, 254, 255, 0.5));
		}
		60% {
			transform: rotateY(360deg) rotate(20deg) scale(1.1);
			filter: drop-shadow(0 0 20px rgba(236, 72, 153, 0.8))
				drop-shadow(0 0 40px rgba(248, 254, 255, 0.4));
		}
		75% {
			transform: rotateY(405deg) rotate(-5deg) scale(1.05);
			filter: drop-shadow(0 0 15px rgba(20, 184, 166, 0.7))
				drop-shadow(0 0 30px rgba(248, 254, 255, 0.3));
		}
		90% {
			transform: rotateY(360deg) rotate(3deg) scale(1.02);
			filter: drop-shadow(0 0 10px rgba(38, 181, 247, 0.7))
				drop-shadow(0 0 25px rgba(248, 254, 255, 0.2));
		}
		100% {
			transform: rotateY(360deg) rotate(0deg) scale(1);
			filter: drop-shadow(0 0 6px rgba(38, 181, 247, 0.6))
				drop-shadow(0 0 20px rgba(248, 254, 255, 0.1));
		}
	}

	@keyframes logo-hover-twirl {
		0% {
			transform: rotateY(0deg) rotate(0deg) scale(1);
			filter: drop-shadow(0 0 6px rgba(38, 181, 247, 0.6))
				drop-shadow(0 0 20px rgba(248, 254, 255, 0.1));
		}
		15% {
			transform: rotateY(90deg) rotate(-15deg) scale(1.1);
			filter: drop-shadow(0 0 15px rgba(20, 184, 166, 0.8))
				drop-shadow(0 0 30px rgba(248, 254, 255, 0.3));
		}
		30% {
			transform: rotateY(180deg) rotate(10deg) scale(1.05);
			filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.8))
				drop-shadow(0 0 40px rgba(248, 254, 255, 0.4));
		}
		45% {
			transform: rotateY(270deg) rotate(-10deg) scale(1.15);
			filter: drop-shadow(0 0 25px rgba(59, 130, 246, 0.9))
				drop-shadow(0 0 50px rgba(248, 254, 255, 0.5));
		}
		60% {
			transform: rotateY(360deg) rotate(20deg) scale(1.1);
			filter: drop-shadow(0 0 20px rgba(236, 72, 153, 0.8))
				drop-shadow(0 0 40px rgba(248, 254, 255, 0.4));
		}
		75% {
			transform: rotateY(405deg) rotate(-5deg) scale(1.05);
			filter: drop-shadow(0 0 15px rgba(20, 184, 166, 0.7))
				drop-shadow(0 0 30px rgba(248, 254, 255, 0.3));
		}
		90% {
			transform: rotateY(360deg) rotate(3deg) scale(1.02);
			filter: drop-shadow(0 0 10px rgba(38, 181, 247, 0.7))
				drop-shadow(0 0 25px rgba(248, 254, 255, 0.2));
		}
		100% {
			transform: rotateY(360deg) rotate(0deg) scale(1);
			filter: drop-shadow(0 0 6px rgba(38, 181, 247, 0.6))
				drop-shadow(0 0 20px rgba(248, 254, 255, 0.1));
		}
	}

	.feature-card {
		background: rgba(15, 23, 42, 0.72);
		transition:
			transform 0.18s ease-out,
			border-color 0.18s ease-out,
			background-color 0.18s ease-out;
	}

	.feature-card:hover {
		transform: translateY(-3px);
		background: rgba(15, 23, 42, 0.9);
		border-color: rgba(45, 212, 191, 0.35);
	}

	.gradient-border {
		position: relative;
		background: rgba(15, 23, 42, 0.82);
		border: 1px solid rgba(45, 212, 191, 0.22);
	}

	.job-icon-card {
		transition:
			transform 0.18s ease-out,
			border-color 0.18s ease-out,
			background-color 0.18s ease-out;
		background: rgba(15, 23, 42, 0.58);
	}

	.job-icon-card:hover {
		transform: translateY(-3px);
		border-color: rgba(45, 212, 191, 0.34);
		background: rgba(15, 23, 42, 0.82);
	}

	.usecase-card {
		background: rgba(15, 23, 42, 0.58);
		transition:
			transform 0.18s ease-out,
			border-color 0.18s ease-out,
			background-color 0.18s ease-out;
	}

	.usecase-card:hover {
		background: rgba(15, 23, 42, 0.78);
		border-color: rgba(45, 212, 191, 0.28);
		transform: translateX(4px);
	}

	@media (prefers-reduced-motion: reduce) {
		.logo-glow,
		.feature-card,
		.job-icon-card,
		.usecase-card {
			animation: none;
			transition: none;
		}

		.logo-glow:hover,
		.feature-card:hover,
		.job-icon-card:hover,
		.usecase-card:hover {
			transform: none;
		}
	}
</style>
