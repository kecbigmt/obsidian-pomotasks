import { writable } from "svelte/store";

const remainingTime = writable(0);
const isWorkPeriod = writable(false);
const isTimerRunning = writable(false);

export default { remainingTime, isWorkPeriod, isTimerRunning };
