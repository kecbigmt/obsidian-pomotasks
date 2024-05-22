import type { Task } from "../../types";
import type {
	ChecklistEvents,
	ChecklistProps,
	OngoingTaskProps,
	TimerEvents,
	TimerProps,
} from "./components/type";

export type SidePaneProps = TimerProps & OngoingTaskProps & ChecklistProps;
export type SidePaneEvents = {
	'timer-run-out': TimerEvents['timer-run-out'];
	'checklist-item-checkbox-eclick': ChecklistEvents['checklist-item-checkbox-click'];
	'file-open-click': ChecklistEvents['file-open-click'];
	'focus-end': CustomEvent<{ task: Task; duration: number }>;
};
