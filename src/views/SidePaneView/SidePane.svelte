<script lang="ts">
import Timer from "./components/Timer.svelte";

export let workMinutes: number;
export let breakMinutes: number;
</script>

<Timer {workMinutes} {breakMinutes} on:timer-pause on:timer-reset on:timer-resume on:timer-run-out on:timer-skip on:timer-start />