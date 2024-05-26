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
    'task-complete': { task: Task };
    'task-stop': { task: Task };
};

export type ChecklistEvents = {
    'file-open-click': { file: File };
} & ChecklistItemEvents;

export type ChecklistItemEvents = {
    'task-complete': { task: Task };
    'task-stop': { task: Task };
    'task-start': { task: Task };
};
