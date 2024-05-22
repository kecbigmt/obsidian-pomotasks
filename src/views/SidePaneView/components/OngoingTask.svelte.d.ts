import { SvelteComponent } from 'svelte';

import type { SessionMode } from '../../store';
import type { OngoingTaskProps, OngoingTaskEvents } from './type';

class OngoingTaskComponent extends SvelteComponent<OngoingTaskProps, OngoingTaskEvents> {}

export default OngoingTaskComponent;