import { SvelteComponent } from 'svelte';

import type { SessionMode } from '../../store';
import type { ChecklistItemProps, ChecklistItemEvents } from './type';

class ChecklistItemComponent extends SvelteComponent<ChecklistItemProps, ChecklistItemEvents> {}

export default ChecklistItemComponent;