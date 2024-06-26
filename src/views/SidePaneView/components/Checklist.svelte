<script lang="ts">
	import { beforeUpdate, createEventDispatcher } from "svelte";
	import { Component, setIcon } from "obsidian";
	import { sessionSetting, symbolSetting } from "../../../store";
	import ChecklistItem from "./ChecklistItem.svelte";
	import type { ChecklistEvents } from "./type";
	import type { File, Task } from "@/models";

	export let file: File;
	export let ongoingTask: Task | null;
	export let parentObsidianComponent: Component;

	let fileLinkIcon: HTMLButtonElement | undefined;

	const dispatch = createEventDispatcher<ChecklistEvents>();

	$: sessionMinutes =
		$sessionSetting.workMinutes + $sessionSetting.breakMinutes;

	beforeUpdate(() => {
		if (fileLinkIcon) setIcon(fileLinkIcon, "chevron-right");
	});
</script>

<div class="file-section">
	<div class="file-section-header">
		<h2 class="file-section-title">{file.name}</h2>
		<button
			class="clickable-icon"
			aria-label="Open file"
			bind:this={fileLinkIcon}
			on:click={() => {
				dispatch("file-open-click", { file });
			}}
		></button>
	</div>
	<div>
		{`Total: ${$symbolSetting.fullTomato}x${file.tomatoCount} (${Math.floor((file.tomatoCount * sessionMinutes) / 60)}h ${(file.tomatoCount * sessionMinutes) % 60}m)`}
	</div>
	<div class="checklist-list">
		{#each file.tasks as task (task.name + "_" + task.filePath)}
			<ChecklistItem
				{task}
				isOngoing={task.name === ongoingTask?.name && task.filePath === ongoingTask?.filePath}
				{parentObsidianComponent}
				on:task-complete
				on:task-start
				on:task-stop
			/>
		{/each}
	</div>
</div>

<style>
	.file-section-header {
		display: flex;
		align-items: center;
		gap: 8px;
		border-bottom: 1px solid #ccc;
	}

	.file-section-title {
		font-weight: bold;
		font-size: 1.25rem;
		line-height: 1.5rem;
		flex-grow: 1;
	}

	.file-section {
		margin-bottom: 32px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.checklist-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
