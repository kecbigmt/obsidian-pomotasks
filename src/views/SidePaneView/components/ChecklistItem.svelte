<script lang="ts">
	import { beforeUpdate, createEventDispatcher, onMount } from "svelte";
	import { Component, MarkdownRenderer, setIcon } from "obsidian";
	import type { Task } from "../../../types";
	import { plugin } from "../../../store";
	import type { ChecklistItemEvents } from "./type";

	export let task: Task;
	export let parentObsidianComponent: Component;

	let taskBodyEl: HTMLDivElement | undefined;
    let focusButtonEl: HTMLButtonElement | undefined;

	const dispatch = createEventDispatcher<ChecklistItemEvents>();

	onMount(() => {
		if (taskBodyEl)
			MarkdownRenderer.render(
				$plugin.app,
				task.body,
				taskBodyEl,
				task.filePath,
				parentObsidianComponent,
			);
	});

    beforeUpdate(() => {
        if (focusButtonEl) setIcon(focusButtonEl, "circle-dot");
    });
</script>

<div class="checklist-item">
	<label class="checklist-item-label">
		<input
			type="checkbox"
			on:click={() => {
				dispatch("checklist-item-checkbox-click", { task });
			}}
		/>
		<div bind:this={taskBodyEl}></div>
	</label>
	<button
		class="clickable-icon"
		aria-label="Focus on"
        bind:this={focusButtonEl}
		on:click={() => {
            dispatch("checklist-item-focus-switch", { task });
		}}
	></button>
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