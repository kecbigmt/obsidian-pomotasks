export type SessionMode = 'work' | 'break';

export type Task = { 
    name: string; 
    remainingTomatoCount: number;
    completedTomatoCount: number;
    filePath: string;
    rawLine: string;
};

export type File = {
    name: string;
    path: string;
    tasks: Task[];
    tomatoCount: number;
};

export type SessionSetting = {
    workMinutes: number;
    breakMinutes: number;
};

export type EmojiSetting = {
    fullTomato: string;
    halfTomato: string;
    quarterTomato: string;
};
