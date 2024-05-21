import { SvelteComponent } from 'svelte';

interface TimerProps {
    workMinutes: number;
    breakMinutes: number;
}

type SessionMode = 'work' | 'break';
type Event = CustomEvent<{ sessionMode: 'work' | 'break', displayRemainingTime: string  }>;

interface TimerEvents {
    'timer-start': Event;
    'timer-pause': Event;
    'timer-reset': Event;
    'timer-skip': Event;
    'timer-run-out': Event;
    'timer-resume': Event;
}

class TimerComponent extends SvelteComponent<TimerProps, TimerEvents> {}

export default TimerComponent;