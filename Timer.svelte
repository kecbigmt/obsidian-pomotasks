<script lang="ts">
	import { setIcon } from "obsidian";
	import { beforeUpdate, onDestroy } from "svelte";
	import store from "./store";

	export let resetTimer = () => {};
	export let startTimer = () => {};
	export let pauseTimer = () => {};
	export let skipTimer = () => {};
	
	let isTimerRunning = false;
	const unsubscribeIsTimerRunning = store.isTimerRunning.subscribe(
		(value) => {
			isTimerRunning = value;
		},
	);

	let isWorkPeriod = true;
	const unsubscribeIsWorkPeriod = store.isWorkPeriod.subscribe((value) => {
		isWorkPeriod = value;
	});

	let remainingTime = 0;
	const unsubscribeRemainingTime = store.remainingTime.subscribe((value) => {
		remainingTime = value;
	});

	$: minutes = Math.floor(remainingTime / 60);
	$: seconds = remainingTime % 60;

	let resetButtonEl: HTMLButtonElement | undefined;
	let startButtonEl: HTMLButtonElement | undefined;
	let pauseButtonEl: HTMLButtonElement | undefined;
	let skipButtonEl: HTMLButtonElement | undefined;
	let clearTaskButtonEl: HTMLButtonElement | undefined;

	beforeUpdate(() => {
		if (startButtonEl) setIcon(startButtonEl, "play");
		if (resetButtonEl) setIcon(resetButtonEl, "rotate-ccw");
		if (pauseButtonEl) setIcon(pauseButtonEl, "pause");
		if (skipButtonEl) setIcon(skipButtonEl, "chevron-last");
		if (clearTaskButtonEl) setIcon(clearTaskButtonEl, "x-circlex");
	});

	onDestroy(() => {
		unsubscribeIsTimerRunning();
		unsubscribeIsWorkPeriod();
		unsubscribeRemainingTime();
	});
</script>

<div class="timer">
	<div class="display-group">
		<div class="period-label">{isWorkPeriod ? "🏃 Work" : "☕️ Break"}</div>
		<div class="timer-display">
			{`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
		</div>
	</div>
	<div class="button-group">
		<button
			class="timer-button"
			on:click={resetTimer}
			bind:this={resetButtonEl}
		></button>
		{#if isTimerRunning}
			<button
				class="timer-button"
				on:click={pauseTimer}
				bind:this={pauseButtonEl}
			></button>
		{:else}
			<button
				class="timer-button"
				on:click={startTimer}
				bind:this={startButtonEl}
			></button>
		{/if}
		<button
			class="timer-button"
			on:click={skipTimer}
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
