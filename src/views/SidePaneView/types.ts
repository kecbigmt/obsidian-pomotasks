import type { Task } from '@/models';
import type { ChecklistEvents, TimerEvents } from './components/type';

export type SidePaneEvents = {
	'timer-run-out': TimerEvents['timer-run-out'];
	'file-open-click': ChecklistEvents['file-open-click'];
	'task-stop': { task: Task; duration: number };
	'task-complete':
		| { task: Task; duration: null }
		| { task: Task; duration: number };
};
