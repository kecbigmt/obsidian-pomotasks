import { SvelteComponent } from 'svelte';
import type { TimerEvents, TimerProps, OngoingTaskProps, OngoingTaskEvents } from './components/type';

class SidePaneComponent extends SvelteComponent<TimerProps & OngoingTaskProps, TimerEvents & OngoingTaskEvents> {}

export default SidePaneComponent;