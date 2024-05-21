import { SvelteComponent } from 'svelte';

interface TimerProps {
    resetTimer: () => void;
    startTimer: () => void;
    pauseTimer: () => void;
    skipTimer: () => void;
  }

class TimerComponent extends SvelteComponent<TimerProps, {}> {}

export default TimerComponent;