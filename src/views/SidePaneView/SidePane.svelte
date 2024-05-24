<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import type { Component } from "obsidian";
	import OngoingTask from "./components/OngoingTask.svelte";
	import Timer from "./components/Timer.svelte";
	import Checklist from "./components/Checklist.svelte";
	import { files } from "../../store";
	import type { Task } from "../../types";
	import type { SidePaneEvents } from "./types";

	export let workMinutes: number;
	export let breakMinutes: number;
	export let parentObsidianComponent: Component;

	let ongoingTask: Task | null = null;
	let ongoingTaskStartTimestamp: number | null = null;
	let ongoingTaskDurationBatch: number[] = [];

	const dispatch = createEventDispatcher<SidePaneEvents>();

	const setOngoingTask = (task: Task) => {
		ongoingTask = task;
	};

	const clearOngoingTask = () => {
		ongoingTask = null;
	};

	const appendDurationFrom = (startTimestamp: number) => {
		return [...ongoingTaskDurationBatch, Date.now() - startTimestamp];
	};

	const startTimer = () => {
		ongoingTaskStartTimestamp = Date.now();
		ongoingTaskDurationBatch = [];
	};

	const pauseTimer = () => {
		if (ongoingTaskStartTimestamp) {
			ongoingTaskDurationBatch = appendDurationFrom(ongoingTaskStartTimestamp);
			ongoingTaskStartTimestamp = null;
		}
	};

	const resetTimer = () => {
		ongoingTaskStartTimestamp = null;
		ongoingTaskDurationBatch = [];
	};

	const resumeTimer = () => {
		ongoingTaskStartTimestamp = Date.now();
	};

	const sum = (arr: number[]) => arr.reduce((acc, cur) => acc + cur, 0);
</script>

<div class="sidepane">
	<Timer
		{workMinutes}
		{breakMinutes}
		on:timer-start={startTimer}
		on:timer-pause={pauseTimer}
		on:timer-resume={resumeTimer}
		on:timer-reset={resetTimer}
		on:timer-skip={() => {
			if (ongoingTaskStartTimestamp && ongoingTask) {
				const duration = sum(appendDurationFrom(ongoingTaskStartTimestamp));
				dispatch("focus-end", { task: ongoingTask, duration });
			}
			resetTimer();
			clearOngoingTask();
		}}
		on:timer-run-out
	/>
	<OngoingTask
		task={ongoingTask}
		{parentObsidianComponent}
		on:ongoing-task-clear={({ detail: { task } }) => {
			if (ongoingTaskStartTimestamp) {
				const duration = sum(appendDurationFrom(ongoingTaskStartTimestamp));
				dispatch("focus-end", { task, duration });
			}
			resetTimer();
			clearOngoingTask();
		}}
	/>
	<div class="checklist-container">
		{#each $files as file (file.name)}
			<Checklist
				{file}
				{parentObsidianComponent}
				on:file-open-click
				on:checklist-item-checkbox-click={({ detail: { task } }) => {
					if (ongoingTaskStartTimestamp && ongoingTask) {
						const duration = sum(appendDurationFrom(ongoingTaskStartTimestamp));
						dispatch("focus-end", { task: ongoingTask, duration });
					}
					resetTimer();
					clearOngoingTask();
					dispatch("checklist-item-checkbox-click", { task });
				}}
				on:checklist-item-focus-switch={({ detail: { task } }) => {
					if (ongoingTaskStartTimestamp && ongoingTask) {
						const duration = sum(appendDurationFrom(ongoingTaskStartTimestamp));
						dispatch("focus-end", { task: ongoingTask, duration });
					}
					startTimer();
					setOngoingTask(task);
				}}
			/>
		{/each}
	</div>
</div>

<style>
	.sidepane {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	
	.checklist-container {
		padding: 10px;
	}
</style>
