import { writable } from "svelte/store";
import type ChecklistPlugin from "./main";

const plugin = writable<ChecklistPlugin>();
const timerStatus = writable<'running' | 'paused' | 'stopped'>('stopped');
const sessionMode = writable<'work' | 'break'>('work');

export default { plugin, timerStatus, sessionMode };
