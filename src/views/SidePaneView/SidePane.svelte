<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import type { Component } from "obsidian";
	import OngoingTask from "./components/OngoingTask.svelte";
	import Timer from "./components/Timer.svelte";
	import Checklist from "./components/Checklist.svelte";
	import { ongoingTask } from "../../store";

	export let workMinutes: number;
	export let breakMinutes: number;
	export let parentObsidianComponent: Component;

	let ongoingTaskStartTimestamp: number | null = null;
	let ongoingTaskDurationBatch: number[] = [];

	const dispatch = createEventDispatcher();
</script>

<div class="sidepane">
	<Timer
		{workMinutes}
		{breakMinutes}
		on:timer-pause={() => {
			if (ongoingTaskStartTimestamp) {
				ongoingTaskDurationBatch = [
					...ongoingTaskDurationBatch,
					Date.now() - ongoingTaskStartTimestamp,
				];
				ongoingTaskStartTimestamp = null;
			}
		}}
		on:timer-reset={() => {
			ongoingTaskStartTimestamp = null;
			ongoingTaskDurationBatch = [];
		}}
		on:timer-resume={() => {
			ongoingTaskStartTimestamp = Date.now();
		}}
		on:timer-skip={() => {
			if (ongoingTaskStartTimestamp) {
				const duration = [
					...ongoingTaskDurationBatch,
					Date.now() - ongoingTaskStartTimestamp,
				].reduce((acc, cur) => acc + cur, 0);
				dispatch("focus-end", { task: $ongoingTask, duration });
			}
			ongoingTaskStartTimestamp = null;
			ongoingTaskDurationBatch = [];
			ongoingTask.set(null);
		}}
		on:timer-run-out
		on:timer-start={() => {
			ongoingTaskStartTimestamp = Date.now();
			ongoingTaskDurationBatch = [];
		}}
	/>
	<OngoingTask
		{parentObsidianComponent}
		on:ongoing-task-clear={({ detail: { task } }) => {
			if (ongoingTaskStartTimestamp) {
				const duration = [
					...ongoingTaskDurationBatch,
					Date.now() - ongoingTaskStartTimestamp,
				].reduce((acc, cur) => acc + cur, 0);
				dispatch("focus-end", { task, duration });
			}
			ongoingTaskStartTimestamp = null;
			ongoingTaskDurationBatch = [];
		}}
	/>
    <Checklist
        {parentObsidianComponent}
		on:checklist-item-checkbox-click
        on:checklist-item-focus-switch={({ detail: { prevTask } }) => {
			if (ongoingTaskStartTimestamp) {
				const duration = [
					...ongoingTaskDurationBatch,
					Date.now() - ongoingTaskStartTimestamp,
				].reduce((acc, cur) => acc + cur, 0);
				dispatch("focus-end", { task: prevTask, duration });
			}
			ongoingTaskStartTimestamp = null;
			ongoingTaskDurationBatch = [];
        }}
    />
</div>

<style>
	.sidepane {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
