<script lang="ts">
	import { Component, MarkdownRenderer, setIcon } from "obsidian";
	import { beforeUpdate, createEventDispatcher } from "svelte";
	import { plugin, sessionSetting, symbolSetting } from "../../../store";
	import { formatTomatCountIntoEmojis, type Task } from "@/models";
	import type { OngoingTaskEvents } from "./type";

    export let parentObsidianComponent: Component;
    export let task: Task | null = null;
    export let duration: number;

	let labelSlotEl: HTMLElement | undefined;
    let completeButtonEl: HTMLButtonElement | undefined;
	let clearIconEl: HTMLButtonElement | undefined;

    $: {
        if (labelSlotEl) {
            labelSlotEl.empty();
            if (task) MarkdownRenderer.render($plugin.app, task.name, labelSlotEl, task.filePath, parentObsidianComponent);
        }
    }

    const dispatch = createEventDispatcher<OngoingTaskEvents>();

	beforeUpdate(() => {
        if (completeButtonEl) setIcon(completeButtonEl, "check-circle");
		if (clearIconEl) setIcon(clearIconEl, "x-circle");
	});
    
    $: tomatoEmojis = formatTomatCountIntoEmojis($symbolSetting, duration/60000/$sessionSetting.workMinutes);
</script>

<div class="ongoing-task-container">
    {#if task}
        <div class="task-display"> 
            <input
                type="checkbox"
                on:click={() => {
                    dispatch("task-complete", { task });
                }}
            />
            <div 
                class="ongoing-task-label" 
                bind:this={labelSlotEl} 
                aria-label={tomatoEmojis}
            >
                <p>dummy</p>
            </div>
            <button
                class="clickable-icon"
                bind:this={clearIconEl} 
                aria-label="Clear"
                on:click={() => {
                    dispatch("task-stop", { task });
                }}
            ></button>
        </div>
    {:else}
        No task selected
    {/if}
</div>

<style>
    .ongoing-task-container {
        padding: 10px;
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        text-align: center;
    }

    .ongoing-task-container .task-display {
        flex-grow: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .ongoing-task-label {
        min-width: 0;
        font-size: 1rem;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }

</style>
