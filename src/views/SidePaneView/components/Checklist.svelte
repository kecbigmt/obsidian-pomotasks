<script lang="ts">
	import { beforeUpdate, createEventDispatcher } from "svelte";
	import { Component, setIcon } from "obsidian";
	import { files, sessionSetting, emojiSetting } from "../../../store";
	import ChecklistItem from "./ChecklistItem.svelte";

	export let parentObsidianComponent: Component;

	let fileLinkIcon: HTMLButtonElement | undefined;

	const dispatch = createEventDispatcher();

	$: sessionMinutes =
		$sessionSetting.workMinutes + $sessionSetting.breakMinutes;

	beforeUpdate(() => {
		if (fileLinkIcon) setIcon(fileLinkIcon, "chevron-right");
	});
</script>

<div class="checklist-container">
	{#each $files as file}
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
				{`Total: ${$emojiSetting.fullTomato}x${file.tomatoCount} (${Math.floor((file.tomatoCount * sessionMinutes) / 60)}h ${(file.tomatoCount * sessionMinutes) % 60}m)`}
			</div>
			<div class="checklist-list">
				{#each file.tasks as task (task.body)}
					<ChecklistItem
						{task}
						{parentObsidianComponent}
						on:checklist-item-checkbox-click
						on:checklist-item-focus-switch
					/>
				{/each}
			</div>
		</div>
	{/each}
</div>
