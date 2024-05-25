import { writable } from "svelte/store";
import type ChecklistPlugin from "./main";
import type { SessionSetting, EmojiSetting } from "./types";
import type { File } from "@/models";

export const plugin = writable<ChecklistPlugin>();
export const sessionSetting = writable<SessionSetting>({ workMinutes: 25, breakMinutes: 5 });
export const emojiSetting = writable<EmojiSetting>({ fullTomato: '🍅', halfTomato: '🍓', quarterTomato: '🍒' });
const timerStatus = writable<'running' | 'paused' | 'stopped'>('stopped');
const sessionMode = writable<'work' | 'break'>('work');
export const files = writable<File[]>([]);

export default { plugin, timerStatus, sessionMode };
