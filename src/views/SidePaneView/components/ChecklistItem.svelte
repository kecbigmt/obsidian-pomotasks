<script lang="ts">
	import { beforeUpdate, createEventDispatcher, onMount } from "svelte";
	import { Component, MarkdownRenderer, setIcon } from "obsidian";
	import type { Task } from "../../../types";
	import { plugin } from "../../../store";

	export let task: Task;
	export let parentObsidianComponent: Component;

	let taskBodyEl: HTMLDivElement | undefined;
    let focusButtonEl: HTMLButtonElement | undefined;

	const dispatch = createEventDispatcher();

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
