<script lang="ts">
	import { setIcon } from "obsidian";
	import { beforeUpdate, createEventDispatcher, onDestroy } from "svelte";

	import type ChecklistPlugin from "./main";
	import store from "./store";

	export let workMinutes = 25;
	export let breakMinutes = 5;

	const dispatch = createEventDispatcher();

	let resetButtonEl: HTMLButtonElement | undefined;
	let startButtonEl: HTMLButtonElement | undefined;
	let pauseButtonEl: HTMLButtonElement | undefined;
	let skipButtonEl: HTMLButtonElement | undefined;
	let clearTaskButtonEl: HTMLButtonElement | undefined;


	let timerInterval: number | undefined;
	let lastTick: number;

	let sessionMode: "work" | "break" = "work";
	$: {
		store.sessionMode.set(sessionMode);
	}

	type TimerState =
		| {
				type: "running";
				endsAt: number;
				pauseAt: null;
				notificationTriggered: boolean;
		  }
		| {
				type: "paused";
				endsAt: number;
				pauseAt: number;
				notificationTriggered: boolean;
		  }
		| null;
	let timerState: TimerState = null;
	$: {
		store.timerStatus.set(timerState?.type ?? 'stopped');
	}
	
	$: timeboxDuration =
		(sessionMode === "work" ? workMinutes : breakMinutes) * 60000;
	$: remainingDuration = timeboxDuration;
	$: minutes = Math.floor(Math.abs(remainingDuration) / 60000);
	$: seconds = Math.floor((Math.abs(remainingDuration) % 60000) / 1000);
	$: displayRemainingTime = `${remainingDuration < 0 ? "-" : ""}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

	$: {
		lastTick;
		timerState;
		remainingDuration = timerState?.type === "running"
			? timerState.endsAt - Date.now()
			: timerState?.type === "paused"
				? timerState.endsAt - timerState.pauseAt
				: timeboxDuration;
	};

	let plugin: ChecklistPlugin;
	const unsubscribePlugin = store.plugin.subscribe((p) => {
		plugin = p;
	});

	$: {
		plugin.statusBarItem.setText(`${sessionMode === 'work' ? '🏃' : '☕️'} ${displayRemainingTime}`);
	}

	const clearInterval = () => {
		if (timerInterval) window.clearInterval(timerInterval);
		timerInterval = undefined;
	};

	beforeUpdate(() => {
		if (startButtonEl) setIcon(startButtonEl, "play");
		if (resetButtonEl) setIcon(resetButtonEl, "rotate-ccw");
		if (pauseButtonEl) setIcon(pauseButtonEl, "pause");
		if (skipButtonEl) setIcon(skipButtonEl, "chevron-last");
		if (clearTaskButtonEl) setIcon(clearTaskButtonEl, "x-circlex");
	});

	onDestroy(() => {
		clearInterval();
		unsubscribePlugin();
	});
</script>

<div class="timer">
	<div class="display-group">
		<div class="period-label">{sessionMode === 'work' ? "🏃 Work" : "☕️ Break"}</div>
		<div class="timer-display">
			{displayRemainingTime}
		</div>
	</div>
	<div class="button-group">
		<button
			class="timer-button"
			on:click={() => {
				timerState = null;
				clearInterval();
				dispatch("timer-reset", { sessionMode, displayRemainingTime });
			}}
			bind:this={resetButtonEl}
		></button>
		{#if timerState?.type === "running"}
			<button
				class="timer-button"
				on:click={() => {
					if (!timerState) return;

					timerState = {
						type: "paused",
						endsAt: timerState.endsAt,
						pauseAt: Date.now(),
						notificationTriggered: timerState.notificationTriggered,
					};
					clearInterval();
					dispatch("timer-pause", {
						sessionMode,
						displayRemainingTime,
					});
				}}
				bind:this={pauseButtonEl}
			></button>
		{:else}
			<button
				class="timer-button"
				on:click={() => {
					if (timerState?.type === "paused") {
						timerState = {
							type: "running",
							endsAt:
								timerState.endsAt +
								(Date.now() - timerState.pauseAt),
							pauseAt: null,
							notificationTriggered:
								timerState.notificationTriggered,
						};
						dispatch("timer-resume", {
							sessionMode,
							displayRemainingTime,
						});
					} else {
						timerState = {
							type: "running",
							endsAt: Date.now() + remainingDuration,
							pauseAt: null,
							notificationTriggered: false,
						};
						dispatch("timer-start", {
							sessionMode,
							displayRemainingTime,
						});
					}

					clearInterval();
					timerInterval = window.setInterval(() => {
						lastTick = Date.now();
						if (
							timerState?.type === "running" &&
							!timerState.notificationTriggered &&
							remainingDuration <= 0
						) {
							timerState = {
								type: "running",
								endsAt: timerState.endsAt,
								pauseAt: null,
								notificationTriggered: true,
							};
							dispatch("timer-run-out", { sessionMode, displayRemainingTime });
						}
					}, 1000);
				}}
				bind:this={startButtonEl}
			></button>
		{/if}
		<button
			class="timer-button"
			on:click={() => {
				timerState = null;
				clearInterval();
				sessionMode = sessionMode === "work" ? "break" : "work";
				dispatch("timer-skip", { sessionMode, displayRemainingTime });
			}}
			bind:this={skipButtonEl}
		></button>
	</div>
</div>

<style>
	.timer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
		padding: 10px;
		border: 1px solid var(--divider-color);
		border-radius: 8px;
	}

	.display-group {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex-grow: 1;
	}

	.period-label {
		font-size: 0.875rem;
	}

	.timer-display {
		font-size: 1.5rem;
		line-height: 1;
	}

	.button-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.timer-button {
		cursor: pointer;
		background: none;
		border: none;
		font-size: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.3s;
	}

	.timer-button:hover {
		background-color: rgba(0, 0, 0, 0.1);
	}
</style>
