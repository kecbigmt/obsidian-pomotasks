export type PomodoroSetting = {
    fullTomatoEmoji: string;
    halfTomatoEmoji: string;
    quarterTomatoEmoji: string;
    workMinutesPerTomato: number;
};

export function getRemainingMinutesFromTaskBody(setting: PomodoroSetting, task: string): number {
    const { fullTomatoEmoji, halfTomatoEmoji, quarterTomatoEmoji } = setting;
    const unconsumedTomatoString = task.replace(/~~.*?~~/g, '').match(new RegExp(`[${fullTomatoEmoji}${halfTomatoEmoji}${quarterTomatoEmoji}]`, 'g'))?.join('') || '';
    return parseTomatoEmojisIntoMinutes(setting, unconsumedTomatoString);
}

export function updateTaskBodyAfterElapsedMinutes(setting: PomodoroSetting, task: string, workMinutes: number): string {
    const emojisPattern = `[\\+${setting.fullTomatoEmoji}${setting.halfTomatoEmoji}${setting.quarterTomatoEmoji}]`;
    
    const consumedEmojisRegexp = new RegExp(`~~${emojisPattern}+~~`, 'g');

    const consumedPart = task.match(consumedEmojisRegexp)?.join(' ') || '';
    const taskWithoutConsumed = task.replace(consumedEmojisRegexp, '').trim();

    const unconsumedEmojisRegexp = new RegExp(`${emojisPattern}+`, 'g');
    const unconsumedPart = taskWithoutConsumed.match(unconsumedEmojisRegexp)?.join('') || '';

    const taskName = taskWithoutConsumed.replace(unconsumedEmojisRegexp, '').trim();

    // Subtract work minutes from unconsumed part
    const updatedUnconsumedPart = subtractMinutesFromTomatoEmojis(setting, unconsumedPart, workMinutes);

    // Build updated task line
    let updatedTask = consumedPart ?? '';
    if (updatedUnconsumedPart) {
        updatedTask += updatedTask === '' ? updatedUnconsumedPart : ` ${updatedUnconsumedPart}`;
    }
    updatedTask += ` ${taskName}`;
    return updatedTask;
}


function parseTomatoEmojisIntoMinutes(setting: PomodoroSetting, input: string): number {
    const fullTomatoCount = (input.match(new RegExp(setting.fullTomatoEmoji, 'g')) || []).length;
    const halfTomatoCount = (input.match(new RegExp(setting.halfTomatoEmoji, 'g')) || []).length;
    const quarterTomatoCount = (input.match(new RegExp(setting.quarterTomatoEmoji, 'g')) || []).length;
    return fullTomatoCount * setting.workMinutesPerTomato +
           halfTomatoCount * (setting.workMinutesPerTomato / 2) +
           quarterTomatoCount * (setting.workMinutesPerTomato / 4);
}

function formatMinutesIntoTomatoEmojis(setting: PomodoroSetting, input: number): string {
    let fullTomatoCount = Math.floor(input / setting.workMinutesPerTomato);
    input %= setting.workMinutesPerTomato;
    let halfTomatoCount = Math.floor(input / (setting.workMinutesPerTomato / 2));
    input %= (setting.workMinutesPerTomato / 2);
    let quarterTomatoCount = Math.round(input / (setting.workMinutesPerTomato / 4));

    if (quarterTomatoCount >= 2) {
        halfTomatoCount += Math.floor(quarterTomatoCount / 2);
        quarterTomatoCount %= 2;
    }

    if (halfTomatoCount >= 2) {
        fullTomatoCount += Math.floor(halfTomatoCount / 2);
        halfTomatoCount %= 2;
    }

    if (fullTomatoCount === 0 && halfTomatoCount === 0 && quarterTomatoCount === 0) {
        throw new Error('Too few minutes to format into tomato emojis: ' + input);
    }

    return setting.fullTomatoEmoji.repeat(fullTomatoCount) +
           setting.halfTomatoEmoji.repeat(halfTomatoCount) +
           setting.quarterTomatoEmoji.repeat(quarterTomatoCount);
}

function subtractMinutesFromTomatoEmojis(setting: PomodoroSetting, tomatoString: string, minutes: number): string {
    const totalMinutes = parseTomatoEmojisIntoMinutes(setting, tomatoString);

    const threshold = setting.workMinutesPerTomato / 4;

    if (totalMinutes === 0) {
        if (minutes < threshold) return '';
        const overTomatoes = formatMinutesIntoTomatoEmojis(setting, minutes);
        return `~~+${overTomatoes}~~`;
    }

    if (minutes > totalMinutes) {
        const overMinutes = minutes - totalMinutes;
        if (overMinutes < threshold) {
            const totalTomatoes = formatMinutesIntoTomatoEmojis(setting, totalMinutes);
            return `~~${totalTomatoes}~~`;
        }
        const overTomatoes = formatMinutesIntoTomatoEmojis(setting, overMinutes);
        const totalTomatoes = formatMinutesIntoTomatoEmojis(setting, totalMinutes);
        return `~~${totalTomatoes}+${overTomatoes}~~`;
    }

    if (minutes < threshold) {
        return formatMinutesIntoTomatoEmojis(setting, totalMinutes);
    }
    const consumedTomatoes = formatMinutesIntoTomatoEmojis(setting, minutes);

    const remainingMinutes = totalMinutes - minutes;
    if (remainingMinutes < threshold) {
        return `~~${consumedTomatoes}~~`;
    }
    const remainingTomatoes = formatMinutesIntoTomatoEmojis(setting, totalMinutes - minutes);

    return `~~${consumedTomatoes}~~ ${remainingTomatoes}`.trim();
}

