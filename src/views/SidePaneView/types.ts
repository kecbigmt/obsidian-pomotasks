import type { Task } from "@/models";
import type {
	ChecklistEvents,
	TimerEvents,
} from "./components/type";

export type SidePaneEvents = {
	'timer-run-out': TimerEvents['timer-run-out'];
	'checklist-item-checkbox-click': ChecklistEvents['checklist-item-checkbox-click'];
	'file-open-click': ChecklistEvents['file-open-click'];
	'focus-end': { task: Task; duration: number };
};
