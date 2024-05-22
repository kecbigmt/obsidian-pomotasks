<script lang="ts">
	import { Component, MarkdownRenderer, setIcon } from "obsidian";
	import { beforeUpdate, createEventDispatcher } from "svelte";
	import { plugin, ongoingTask } from "../../../store";

    export let parentObsidianComponent: Component;

	let labelSlotEl: HTMLElement | undefined;
	let clearIconEl: HTMLButtonElement | undefined;

    $: {
        if (labelSlotEl) {
            labelSlotEl.empty();
            if ($ongoingTask) MarkdownRenderer.render($plugin.app, $ongoingTask.body, labelSlotEl, $ongoingTask.filePath, parentObsidianComponent);
        }
    }

    const dispatch = createEventDispatcher();

	beforeUpdate(() => {
		if (clearIconEl) setIcon(clearIconEl, "x-circle");
	});
</script>

<div class="ongoing-task-container">
	<div class="ongoing-task-label">
        {#if $ongoingTask}
            <span bind:this={labelSlotEl}></span>
        {:else}
            <span>No task selected</span>
        {/if}
    </div>
    {#if $ongoingTask}
    	<button
            class="clickable-icon"
            bind:this={clearIconEl} 
            aria-label="Cancel"
            on:click={() => {
                dispatch("ongoing-task-clear", { task: $ongoingTask });
                ongoingTask.set(null);
            }}
        ></button>
    {/if}
</div>

<style>
    .ongoing-task-container {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
        border: 1px solid var(--divider-color);
        border-radius: 8px;
    }

    .ongoing-task-label {
        font-size: 1rem;
        text-align: center;
        
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }
</style>
