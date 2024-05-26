import type { EmojiSetting } from '@/types';
import { constructTaskFromLine, type Task } from './Task';

export type File = {
	name: string;
	path: string;
	tasks: Task[];
	tomatoCount: number;
};

export const constructFileFromContent = (
	emojiSetting: EmojiSetting,
	content: string,
	fileName: string,
	filePath: string
) => {
	const lines = content.split('\n');
	let tasks: Task[] = [];
	let tomatoCount = 0;

	for (const line of lines) {
		if (line.match(/^\s*-\s*\[\s\]/)) {
			const task = constructTaskFromLine(emojiSetting, line, filePath);
			tasks.push(task);
			tomatoCount += task.remainingTomatoCount;
		}
	}

	return { name: fileName.replace(/\.[^/.]+$/, ''), path: filePath, tasks, tomatoCount };
};
