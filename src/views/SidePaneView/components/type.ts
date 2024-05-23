import type { Component } from "obsidian";
import type { SessionMode, File, Task } from "../../../types";

export type TimerProps = {
    workMinutes: number;
    breakMinutes: number;
};

export type TimerCommonEvent = CustomEvent<{ sessionMode: SessionMode, displayRemainingTime: string  }>;

export type TimerEvents = {
    'timer-start': TimerCommonEvent;
    'timer-pause': TimerCommonEvent;
    'timer-reset': TimerCommonEvent;
    'timer-skip': TimerCommonEvent;
    'timer-run-out': TimerCommonEvent;
    'timer-resume': TimerCommonEvent;
};

export type OngoingTaskProps = {
    task: Task | null;
    parentObsidianComponent: Component;
};

export type OngoingTaskEvents = {
    'ongoing-task-clear': CustomEvent<{ task: Task }>;
};

export type ChecklistProps = {
    parentObsidianComponent: Component;
};

export type ChecklistEvents = {
    'file-open-click': CustomEvent<{ file: File }>;
} & ChecklistItemEvents;

export type ChecklistItemProps = {
    task: Task;
    parentObsidianComponent: Component;
};

export type ChecklistItemEvents = {
    'checklist-item-checkbox-click': CustomEvent<{ task: Task }>;
    'checklist-item-focus-switch': CustomEvent<{ task: Task }>;
};
