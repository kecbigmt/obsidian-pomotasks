import type { SymbolSetting } from '../types';

export type Task = {
	name: string;
	remainingTomatoCount: number;
	completedTomatoCount: number;
	overCompletedTomatoCount: number;
	filePath: string;
	rawLine: string;
};

export const constructTaskFromLine = (setting: SymbolSetting, rawLine: string, filePath: string): Task => {
	const taskBody = rawLine.replace(/^\s*- \[ \]/, '').trim();

	const { fullTomato, halfTomato, quarterTomato } = setting;
	const completedTomatoEmojis = taskBody.match(/~~.*?~~/g) ?? [];
	const [completedEstimatedTomatoEmojis, completedAdditionalTomatoEmojis] =
		splitCompletedTomatoEmojisIntoEstimatedAndAdditional(completedTomatoEmojis);

	const completedTomatoCount = parseTomatoEmojisIntoCount(setting, completedEstimatedTomatoEmojis);
	const overCompletedTomatoCount = parseTomatoEmojisIntoCount(setting, completedAdditionalTomatoEmojis);

	const taskBodyExcludingCompletedTomatoes = taskBody.replace(/~~.*?~~/g, '');

	const remainingTomatoEmojis =
		taskBodyExcludingCompletedTomatoes
			.match(new RegExp(`[${fullTomato}${halfTomato}${quarterTomato}]`, 'g'))
			?.join('') || '';
	const remainingTomatoCount = parseTomatoEmojisIntoCount(setting, remainingTomatoEmojis);

	const name = taskBodyExcludingCompletedTomatoes
		.replace(new RegExp(`[${fullTomato}${halfTomato}${quarterTomato}]`, 'g'), '')
		.trim();

	return {
		name,
		remainingTomatoCount,
		completedTomatoCount,
		overCompletedTomatoCount,
		filePath,
		rawLine,
	};
};

export const formatTaskToBody = (setting: SymbolSetting, task: Task): string => {
    const completedEstimatedTomatoEmojis = formatTomatCountIntoEmojis(setting, task.completedTomatoCount);
    const completedAdditionalTomatoEmojis = formatTomatCountIntoEmojis(setting, task.overCompletedTomatoCount);
    const remainingTomatoEmojis = formatTomatCountIntoEmojis(setting, task.remainingTomatoCount);

    const completedPart =
        completedEstimatedTomatoEmojis || completedAdditionalTomatoEmojis
            ? !completedAdditionalTomatoEmojis
                ? `~~${completedEstimatedTomatoEmojis}~~`
                : `~~${completedEstimatedTomatoEmojis}+${completedAdditionalTomatoEmojis}~~`
            : null;
    const remainingPart = remainingTomatoEmojis ? `${remainingTomatoEmojis}` : null;

    return [completedPart, remainingPart, task.name].filter((part) => part).join(' ');
}

export const formatTaskToLine = (setting: SymbolSetting, task: Task): string => {
	const taskBody = formatTaskToBody(setting, task);
	const startIndex = task.rawLine.indexOf('- [ ] ');
	const endIndex = startIndex + '- [ ] '.length;
	const rawTaskBody = task.rawLine.substring(endIndex);

	return task.rawLine.replace(rawTaskBody, taskBody);
};

export const substractTomatoCountFromTask = (task: Task, count: number): Task => {
    if (count < 0) {
        throw new Error('Count must be greater than or equal to 0');
    }
	
	// Round down to the nearest quarter
	const floorCount = Math.floor(count * 4) / 4;

    const diff = task.remainingTomatoCount - floorCount;
    const remainingTomatoCount = Math.max(0, diff);
    const completedTomatoCount = diff < 0 ? task.completedTomatoCount + task.remainingTomatoCount : task.completedTomatoCount + floorCount;
    const overCompletedTomatoCount = diff < 0 ? task.overCompletedTomatoCount - diff : task.overCompletedTomatoCount;

    return {
        ...task,
        remainingTomatoCount,
        completedTomatoCount,
        overCompletedTomatoCount,
    };
}

function splitCompletedTomatoEmojisIntoEstimatedAndAdditional(completedTomatoEmojis: string[]): [string, string] {
	return completedTomatoEmojis
		.reduce<[string[], string[]]>(
			([planned, additional], emojis) => {
				const [plannedEmojis, ...additionalEmojis] = emojis.split('+');
				planned.push(plannedEmojis);
				additional.push(additionalEmojis.join(''));
				return [planned, additional];
			},
			[[], []]
		)
		.map((emojis) => emojis.join('')) as [string, string];
}

function parseTomatoEmojisIntoCount(setting: SymbolSetting, input: string): number {
	const fullTomatoCount = (input.match(new RegExp(setting.fullTomato, 'g')) || []).length;
	const halfTomatoCount = (input.match(new RegExp(setting.halfTomato, 'g')) || []).length;
	const quarterTomatoCount = (input.match(new RegExp(setting.quarterTomato, 'g')) || []).length;
	return fullTomatoCount + halfTomatoCount / 2 + quarterTomatoCount / 4;
}

export function formatTomatCountIntoEmojis(setting: SymbolSetting, count: number): string {
	const fullTomatoCount = Math.floor(count);
	const halfTomatoCount = Math.floor((count % 1) * 2);
	const quarterTomatoCount = Math.floor((count % 0.5) * 4);

	return (
		setting.fullTomato.repeat(fullTomatoCount) +
		setting.halfTomato.repeat(halfTomatoCount) +
		setting.quarterTomato.repeat(quarterTomatoCount)
	);
}
