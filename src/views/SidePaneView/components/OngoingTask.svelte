<script lang="ts">
	import { Component, MarkdownRenderer, setIcon } from "obsidian";
	import { beforeUpdate, createEventDispatcher } from "svelte";
	import { plugin } from "../../../store";
	import type { Task } from "../../../types";
	import type { OngoingTaskEvents } from "./type";

    export let parentObsidianComponent: Component;
    export let task: Task | null = null;

	let labelSlotEl: HTMLElement | undefined;
	let clearIconEl: HTMLButtonElement | undefined;

    $: {
        if (labelSlotEl) {
            labelSlotEl.empty();
            if (task) MarkdownRenderer.render($plugin.app, task.body, labelSlotEl, task.filePath, parentObsidianComponent);
        }
    }

    const dispatch = createEventDispatcher<OngoingTaskEvents>();

	beforeUpdate(() => {
		if (clearIconEl) setIcon(clearIconEl, "x-circle");
	});
</script>

<div class="ongoing-task-container">
	<div class="ongoing-task-label">
        {#if task}
            <span bind:this={labelSlotEl}></span>
        {:else}
            <span>No task selected</span>
        {/if}
    </div>
    {#if task}
    	<button
            class="clickable-icon"
            bind:this={clearIconEl} 
            aria-label="Clear"
            on:click={() => {
                dispatch("ongoing-task-clear", { task });
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
