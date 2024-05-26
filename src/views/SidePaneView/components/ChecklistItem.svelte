<script lang="ts">
	import { afterUpdate, beforeUpdate, createEventDispatcher, onMount } from "svelte";
	import { Component, MarkdownRenderer, setIcon } from "obsidian";
	import { formatTaskToBody, type Task } from "@/models";
	import { symbolSetting, plugin } from "../../../store";
	import type { ChecklistItemEvents } from "./type";

	export let task: Task;
	export let isOngoing: boolean;
	export let parentObsidianComponent: Component;

	let taskBodyEl: HTMLDivElement | undefined;
    let taskStartButtonEl: HTMLButtonElement | undefined;
	let taskStopButtonEl: HTMLButtonElement | undefined;

	$: taskBody = formatTaskToBody($symbolSetting, task);
	$: renderTaskBody = (taskBodyEl: HTMLElement) => {
		MarkdownRenderer.render(
			$plugin.app,
			taskBody,
			taskBodyEl,
			task.filePath,
			parentObsidianComponent,
		);
	}
	
	const dispatch = createEventDispatcher<ChecklistItemEvents>();

	onMount(() => {
		if (taskBodyEl) renderTaskBody(taskBodyEl);
	})

    beforeUpdate(() => {
        if (taskStartButtonEl) setIcon(taskStartButtonEl, "play-circle");
		if (taskStopButtonEl) setIcon(taskStopButtonEl, "x-circle");
    });

	afterUpdate(() => {
		if (taskBodyEl) {
			taskBodyEl.empty();
			renderTaskBody(taskBodyEl);
		}
	})
</script>

<div class="checklist-item">
	<label class="checklist-item-label">
		<input
			type="checkbox"
			on:click={() => {
				dispatch('task-complete', { task });
			}}
		/>
		<div bind:this={taskBodyEl}></div>
	</label>
	{#if isOngoing}
		<button
			class="clickable-icon"
			aria-label="Stop task"
			bind:this={taskStopButtonEl}
			on:click={() => {
				dispatch('task-stop', { task });
			}}
		></button>
	{:else}
		<button
			class="clickable-icon"
			aria-label="Start task"
			bind:this={taskStartButtonEl}
			on:click={() => {
				dispatch('task-start', { task });
			}}
		></button>
	{/if}
</div>

<style>
	.checklist-item {
		display: flex;
		align-items: center;
		gap: 2px;
		justify-content: space-between;
	}

	.checklist-item-label {
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.checklist-item-label:hover {
		text-decoration: underline;
	}
</style>
