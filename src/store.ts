import { writable } from "svelte/store";
import type ChecklistPlugin from "./main";

const plugin = writable<ChecklistPlugin>();
export default { plugin };
