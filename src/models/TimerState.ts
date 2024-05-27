
export type TimerState = StoppedTimerState | RunningTimerState | PausedTimerState;

export type StoppedTimerState = {
    type: 'stopped';
    endsAt: null;
    pauseAt: null;
    notificationTriggered: boolean;
};

export type RunningTimerState = {
    type: 'running';
    endsAt: number;
    pauseAt: null;
    notificationTriggered: boolean;
};

export type PausedTimerState = {
    type: 'paused';
    endsAt: number;
    pauseAt: number;
    notificationTriggered: boolean;
};

export const resetTimer = (): StoppedTimerState => ({
    type: 'stopped',
    endsAt: null,
    pauseAt: null,
    notificationTriggered: false,
});

export const startNewTimer = (duration: number): RunningTimerState => ({
    type: 'running',
    endsAt: Date.now() + duration,
    pauseAt: null,
    notificationTriggered: false,
});

export const pauseTimer = (state: RunningTimerState): PausedTimerState => ({
    ...state,
    type: 'paused',
    pauseAt: Date.now(),
});

export const resumeTimer = (state: PausedTimerState): RunningTimerState => ({
    ...state,
    type: 'running',
    endsAt: state.endsAt - state.pauseAt + Date.now(),
    pauseAt: null,
});

export const markTimerAsNotified = (state: TimerState): TimerState => ({
    ...state,
    notificationTriggered: true,
});
