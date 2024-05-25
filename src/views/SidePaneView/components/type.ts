import type { SessionMode } from "@/types";
import type { Task, File } from "@/models";

export type TimerCommonParams = { sessionMode: SessionMode, displayRemainingTime: string  };

export type TimerEvents = {
    'timer-start': TimerCommonParams;
    'timer-pause': TimerCommonParams;
    'timer-reset': TimerCommonParams;
    'timer-skip': TimerCommonParams;
    'timer-run-out': TimerCommonParams;
    'timer-resume': TimerCommonParams;
};

export type OngoingTaskEvents = {
    'ongoing-task-clear': { task: Task };
};

export type ChecklistEvents = {
    'file-open-click': { file: File };
} & ChecklistItemEvents;

export type ChecklistItemEvents = {
    'checklist-item-checkbox-click': { task: Task };
    'checklist-item-focus-switch': { task: Task };
};
