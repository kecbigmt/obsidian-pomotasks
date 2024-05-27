<script lang="ts">
	import { setIcon } from "obsidian";
	import { beforeUpdate, createEventDispatcher, onDestroy } from "svelte";

	import { plugin, sessionMode, sessionSetting, timerState } from "@/store";
	import type { TimerEvents } from "./type";
	import { markTimerAsNotified, pauseTimer, resetTimer, resumeTimer, startNewTimer } from "@/models/TimerState";

	const dispatch = createEventDispatcher<TimerEvents>();

	let resetButtonEl: HTMLButtonElement | undefined;
	let startButtonEl: HTMLButtonElement | undefined;
	let pauseButtonEl: HTMLButtonElement | undefined;
	let skipButtonEl: HTMLButtonElement | undefined;
	let clearTaskButtonEl: HTMLButtonElement | undefined;


	let timerInterval: number | undefined;
	let lastTick: number;

	$: timeboxDuration =
		($sessionMode === "work" ? $sessionSetting.workMinutes : $sessionSetting.breakMinutes) * 60000;
	$: remainingDuration = timeboxDuration;
	$: minutes = Math.floor(Math.abs(remainingDuration) / 60000);
	$: seconds = Math.floor((Math.abs(remainingDuration) % 60000) / 1000);
	$: displayRemainingTime = `${remainingDuration < 0 ? "-" : ""}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
	
	$: {
		lastTick;
		remainingDuration = $timerState.type === "running"
			? $timerState.endsAt - Date.now()
			: $timerState.type === "paused"
				? $timerState.endsAt - $timerState.pauseAt
				: timeboxDuration;
	};

	$: {
		clearInterval();
		if($timerState.type === 'running') timerInterval = window.setInterval(tickTimer, 1000);
	}

	$: {
		$plugin.statusBarItem?.setText(`${$sessionMode === 'work' ? '🏃' : '☕️'} ${displayRemainingTime}`);
	}

	const clearInterval = () => {
		if (timerInterval) window.clearInterval(timerInterval);
		timerInterval = undefined;
	};

	const tickTimer = () => {
		lastTick = Date.now();
		if ($timerState.type === 'running' && !$timerState.notificationTriggered && remainingDuration <= 0) {
			timerState.update((state) => markTimerAsNotified(state));
			dispatch("timer-run-out", { sessionMode: $sessionMode, displayRemainingTime });
			clearInterval();
		}
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
	});
</script>

<div class="timer">
	<div class="display-group">
		<div class="period-label">{$sessionMode === 'work' ? "🏃 Work" : "☕️ Break"}</div>
		<div class="timer-display">
			{displayRemainingTime}
		</div>
	</div>
	<div class="button-group">
		<button
			class="timer-button"
			on:click={() => {
				timerState.set(resetTimer());
				dispatch("timer-reset", { sessionMode: $sessionMode, displayRemainingTime });
			}}
			bind:this={resetButtonEl}
		></button>
		{#if $timerState.type === "running"}
			<button
				class="timer-button"
				on:click={() => {
					timerState.set(pauseTimer($timerState));
					dispatch("timer-pause", {
						sessionMode: $sessionMode,
						displayRemainingTime,
					});
				}}
				bind:this={pauseButtonEl}
			></button>
		{:else}
			<button
				class="timer-button"
				on:click={() => {
					if ($timerState.type === "paused") {
						timerState.set(resumeTimer($timerState));
						dispatch("timer-resume", {
							sessionMode: $sessionMode,
							displayRemainingTime,
						});
					} else {
						timerState.set(startNewTimer(remainingDuration));
						dispatch("timer-start", {
							sessionMode: $sessionMode,
							displayRemainingTime,
						});
					}
				}}
				bind:this={startButtonEl}
			></button>
		{/if}
		<button
			class="timer-button"
			on:click={() => {
				timerState.set(resetTimer());
				sessionMode.update((cur) => cur === "work" ? "break" : "work");
				dispatch("timer-skip", { sessionMode: $sessionMode, displayRemainingTime });
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
