import { SvelteComponent } from 'svelte';
import type { TimerEvents, TimerProps } from './components/type';

class SidePaneComponent extends SvelteComponent<TimerProps, TimerEvents> {}

export default SidePaneComponent;