import { SvelteComponent } from 'svelte';

import type { SessionMode } from '../../store';
import type { ChecklistProps, ChecklistEvents } from './type';

class ChecklistComponent extends SvelteComponent<ChecklistProps, ChecklistEvents> {}

export default ChecklistComponent;