<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import PageTitle from "$lib/components/page/PageTitle.svelte";
	import { Icon } from "svelte-icons-pack";
	import { BiJoystick, BiCheck } from "svelte-icons-pack/bi";
	import { getGamepadButtonUrl } from "$lib/iconLoader";
	import { formatGamepadInput } from "$lib/helpers";
	import type { GamepadInput } from "$lib/stores";

	let gamepadLayout: 'ps' | 'xbox' | null = null;
	let mounted = false;
	
	// Controller testing
	let detectedGamepad: Gamepad | null = null;
	let currentInput: GamepadInput | null = null;
	let animationFrameId: number;

	onMount(() => {
		const saved = localStorage.getItem('gamepadLayout');
		if (saved === 'ps' || saved === 'xbox') {
			gamepadLayout = saved;
		}
		mounted = true;
		
		// Start polling for gamepad input
		pollGamepads();
	});
	
	onDestroy(() => {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
		}
	});

	function selectLayout(layout: 'ps' | 'xbox') {
		gamepadLayout = layout;
		localStorage.setItem('gamepadLayout', layout);
	}
	
	function pollGamepads() {
		const gamepads = navigator.getGamepads();
		
		// Check for button presses
		for (let i = 0; i < gamepads.length; i++) {
			const gamepad = gamepads[i];
			if (!gamepad) continue;
			
			const anyButtonPressed = gamepad.buttons.some(btn => btn.pressed);
			
			// Detect or switch to a gamepad when any button is pressed
			if (anyButtonPressed && (!detectedGamepad || gamepad.index !== detectedGamepad.index)) {
				detectedGamepad = gamepad;
				currentInput = null; // Reset current input when switching
			}
			
			// If this is our detected gamepad, track current input
			if (detectedGamepad && gamepad.index === detectedGamepad.index) {
				let pressedButtons: number[] = [];
				gamepad.buttons.forEach((btn, idx) => {
					if (btn.pressed) {
						pressedButtons.push(idx);
					}
				});
				
				if (pressedButtons.length === 0) {
					currentInput = null;
				} else if (pressedButtons.length === 1) {
					currentInput = { button: pressedButtons[0] };
				} else if (pressedButtons.length >= 2) {
					// Treat first button as trigger, second as main button
					currentInput = { trigger: pressedButtons[0], button: pressedButtons[1] };
				}
			}
		}
		
		animationFrameId = requestAnimationFrame(pollGamepads);
	}
</script>

<div class="p-4 border border-slate-900/60 rounded mb-8 bg-slate-900/40">
	<PageTitle>
		<div class="flex items-center gap-2">
			<Icon src={BiJoystick} size="1.3em" className="text-teal-400" />
			<span>Gamepad Configuration</span>
		</div>
	</PageTitle>

	<p>In case you want to use your Gamepad for twirling, you can configure and test it here.</p>

	<div class="mt-6 space-y-6">
		<div>
			<h3 class="text-lg font-semibold text-slate-200 mb-2">Button Layout</h3>
			<p class="text-sm text-slate-400 mb-4">Select your gamepad's button layout to see the correct button icons throughout the app.</p>
			
			<div class="grid grid-cols-2 gap-4 max-w-md">
				<!-- PlayStation Layout -->
				<button
					class="group relative overflow-hidden rounded-lg border-2 transition-all hover:border-teal-500 hover:shadow-lg hover:shadow-teal-500/20 {gamepadLayout === 'ps' ? 'border-teal-500 bg-teal-900/20' : 'border-slate-600 bg-slate-800'}"
					on:click={() => selectLayout('ps')}
				>
					<div style="padding: 1.5rem;">
						<div class="flex items-center justify-between mb-4">
							<p class="text-base font-semibold text-slate-200">PlayStation</p>
							{#if mounted && gamepadLayout === 'ps'}
								<Icon src={BiCheck} size="1.5em" className="text-teal-400" />
							{/if}
						</div>
						<div class="grid grid-cols-4 gap-3">
							<img src={getGamepadButtonUrl('ps', 0)} alt="Cross" class="w-full h-auto rounded" />
							<img src={getGamepadButtonUrl('ps', 1)} alt="Circle" class="w-full h-auto rounded" />
							<img src={getGamepadButtonUrl('ps', 2)} alt="Square" class="w-full h-auto rounded" />
							<img src={getGamepadButtonUrl('ps', 3)} alt="Triangle" class="w-full h-auto rounded" />
						</div>
					</div>
				</button>

				<!-- Xbox Layout -->
				<button
					class="group relative overflow-hidden rounded-lg border-2 transition-all hover:border-teal-500 hover:shadow-lg hover:shadow-teal-500/20 {gamepadLayout === 'xbox' ? 'border-teal-500 bg-teal-900/20' : 'border-slate-600 bg-slate-800'}"
					on:click={() => selectLayout('xbox')}
				>
					<div style="padding: 1.5rem;">
						<div class="flex items-center justify-between mb-4">
							<p class="text-base font-semibold text-slate-200">Xbox</p>
							{#if mounted && gamepadLayout === 'xbox'}
								<Icon src={BiCheck} size="1.5em" className="text-teal-400" />
							{/if}
						</div>
						<div class="grid grid-cols-4 gap-3">
							<img src={getGamepadButtonUrl('xbox', 0)} alt="A" class="w-full h-auto rounded" />
							<img src={getGamepadButtonUrl('xbox', 1)} alt="B" class="w-full h-auto rounded" />
							<img src={getGamepadButtonUrl('xbox', 2)} alt="X" class="w-full h-auto rounded" />
							<img src={getGamepadButtonUrl('xbox', 3)} alt="Y" class="w-full h-auto rounded" />
						</div>
					</div>
				</button>
			</div>
		</div>
		
		<!-- Controller Testing Section -->
		<div>
			<h3 class="text-lg font-semibold text-slate-200 mb-2">Controller Testing</h3>
			<p class="text-sm text-slate-400 mb-4">Test your controller input detection.</p>
			
			<div class="rounded-lg border border-slate-600 bg-slate-800 p-4 space-y-4">
				{#if !detectedGamepad}
					<div class="text-center py-8">
						<Icon src={BiJoystick} size="3em" className="text-slate-500 mx-auto mb-4" />
						<p class="text-slate-300 font-medium">Press any button on your controller</p>
						<p class="text-sm text-slate-500 mt-1">to detect and test it</p>
					</div>
				{:else}
					<div class="space-y-3">
						<div>
							<p class="text-sm text-slate-400 mb-1">Detected Controller:</p>
							<p class="text-slate-200 font-medium flex items-center gap-2">
								<Icon src={BiCheck} size="1.2em" className="text-teal-400" />
								{detectedGamepad.id}
							</p>
						</div>
						
						<div>
							<p class="text-sm text-slate-400 mb-1">Current Input:</p>
							<div class="bg-slate-900 rounded px-4 py-3 font-mono text-lg">
								{#if currentInput}
									<span class="text-teal-400">{formatGamepadInput(currentInput)}</span>
								{:else}
									<span class="text-slate-500">No buttons pressed</span>
								{/if}
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
