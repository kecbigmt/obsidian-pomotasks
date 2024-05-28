<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import type { Component } from "obsidian";
	import { files, lastTick, sessionMode, sessionSetting, timerState } from "@/store";
	import type { Task } from "@/models";
	import { resumeTimer, startNewTimer } from "@/models/TimerState";
	import type { SidePaneEvents } from "./types";
	import OngoingTask from "./components/OngoingTask.svelte";
	import Timer from "./components/Timer.svelte";
	import Checklist from "./components/Checklist.svelte";

	export let parentObsidianComponent: Component;

	let ongoingTask: Task | null = null;
	let ongoingTaskStartTimestamp: number | null = null;
	let ongoingTaskDurationBatch: number[] = [];

	let ongoingTaskDuration: number;
	$: {
		$lastTick;
		const currentDuration = ongoingTaskStartTimestamp ? Date.now() - ongoingTaskStartTimestamp : 0;
		ongoingTaskDuration = currentDuration + sum(ongoingTaskDurationBatch);
	}

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

	const startOngoingTaskTimer = () => {
		ongoingTaskStartTimestamp = Date.now();
		ongoingTaskDurationBatch = [];
	};

	const pauseOngoingTaskTimer = () => {
		if (ongoingTaskStartTimestamp) {
			ongoingTaskDurationBatch = appendDurationFrom(ongoingTaskStartTimestamp);
			ongoingTaskStartTimestamp = null;
		}
	};

	const resetOngoingTaskTimer = () => {
		ongoingTaskStartTimestamp = null;
		ongoingTaskDurationBatch = [];
	};

	const resumeOngoingTaskTimer = () => {
		ongoingTaskStartTimestamp = Date.now();
	};

	const sum = (arr: number[]) => arr.reduce((acc, cur) => acc + cur, 0);
</script>

<div class="sidepane">
	<Timer
		on:timer-start={startOngoingTaskTimer}
		on:timer-pause={pauseOngoingTaskTimer}
		on:timer-resume={resumeOngoingTaskTimer}
		on:timer-reset={resetOngoingTaskTimer}
		on:timer-skip={() => {
			if (ongoingTaskStartTimestamp && ongoingTask) {
				const duration = sum(appendDurationFrom(ongoingTaskStartTimestamp));
				dispatch("task-stop", { task: ongoingTask, duration });
			}
			resetOngoingTaskTimer();
			clearOngoingTask();
		}}
		on:timer-run-out
	/>
	<OngoingTask
		task={ongoingTask}
		duration={ongoingTaskDuration}
		{parentObsidianComponent}
		on:task-complete={() => {
			if (ongoingTaskStartTimestamp && ongoingTask) {
				const duration = sum(appendDurationFrom(ongoingTaskStartTimestamp));
				dispatch("task-complete", { task: ongoingTask, duration });
			}
			resetOngoingTaskTimer();
			clearOngoingTask();
		}}
		on:task-stop={({ detail: { task } }) => {
			if (ongoingTaskStartTimestamp) {
				const duration = sum(appendDurationFrom(ongoingTaskStartTimestamp));
				dispatch("task-stop", { task, duration });
			}
			resetOngoingTaskTimer();
			clearOngoingTask();
		}}
	/>
	<div class="checklist-container">
		{#each $files as file (file.name)}
			<Checklist
				{ongoingTask}
				{file}
				{parentObsidianComponent}
				on:file-open-click
				on:task-complete={({ detail: { task } }) => {
					if (ongoingTaskStartTimestamp && ongoingTask && task.name === ongoingTask.name ) {
						const duration = sum(appendDurationFrom(ongoingTaskStartTimestamp));
						dispatch("task-complete", { task, duration });
					} else {
						dispatch("task-complete", { task, duration: null });
					}
					resetOngoingTaskTimer();
					clearOngoingTask();
				}}
				on:task-start={({ detail: { task } }) => {
					if (ongoingTaskStartTimestamp && ongoingTask) {
						const duration = sum(appendDurationFrom(ongoingTaskStartTimestamp));
						dispatch("task-stop", { task: ongoingTask, duration });
					}
					startOngoingTaskTimer();
					sessionMode.set("work");
					timerState.update((state) => {
						if (state.type === 'paused') return resumeTimer(state);
						if (state.type === 'running') return state;
						return startNewTimer($sessionSetting.workMinutes * 60000);
					});
					setOngoingTask(task);
				}}
				on:task-stop={({ detail: { task } }) => {
					if (ongoingTaskStartTimestamp && ongoingTask && task.name === ongoingTask.name ) {
						const duration = sum(appendDurationFrom(ongoingTaskStartTimestamp));
						dispatch("task-stop", { task, duration });
					}
					resetOngoingTaskTimer();
					clearOngoingTask();
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
