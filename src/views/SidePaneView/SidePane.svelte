<script lang="ts">
	import type { Component } from "obsidian";
	import OngoingTask from "./components/OngoingTask.svelte";
	import Timer from "./components/Timer.svelte";

	export let workMinutes: number;
	export let breakMinutes: number;
	export let parentObsidianComponent: Component;
</script>

<div class="sidepane">
	<Timer
		{workMinutes}
		{breakMinutes}
		on:timer-pause
		on:timer-reset
		on:timer-resume
		on:timer-run-out
		on:timer-skip
		on:timer-start
	/>
	<OngoingTask {parentObsidianComponent} on:ongoing-task-clear />
</div>

<style>
	.sidepane {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
