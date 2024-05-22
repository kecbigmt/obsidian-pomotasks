import { SvelteComponent } from 'svelte';

import type { SessionMode } from '../../store';
import type { TimerEvents, TimerProps } from './type';

class SidePaneComponent extends SvelteComponent<TimerProps, TimerEvents> {}

export default SidePaneComponent;