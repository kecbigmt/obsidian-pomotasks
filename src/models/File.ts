import type { Task } from "./Task";

export type File = {
    name: string;
    path: string;
    tasks: Task[];
    tomatoCount: number;
};
