import { writable } from "svelte/store";
import type ChecklistPlugin from "./main";
import type { Task } from "./types";

export const plugin = writable<ChecklistPlugin>();
const timerStatus = writable<'running' | 'paused' | 'stopped'>('stopped');
const sessionMode = writable<'work' | 'break'>('work');
export const ongoingTask = writable<Task | null>(null);

export default { plugin, timerStatus, sessionMode };
