import type { Component } from "obsidian";
import type { SessionMode } from "types";

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
    parentObsidianComponent: Component;
};

export type OngoingTaskEvents = {
    'ongoing-task-clear': CustomEvent<{ taskBody: string }>;
};
