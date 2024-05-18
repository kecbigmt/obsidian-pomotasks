export type PomodoroSetting = {
    fullTomatoEmoji: string;
    halfTomatoEmoji: string;
    quarterTomatoEmoji: string;
    workMinutesPerTomato: number;
};

export function getRemainingMinutesFromTaskLine(setting: PomodoroSetting, taskLine: string): number {
    const { fullTomatoEmoji, halfTomatoEmoji, quarterTomatoEmoji } = setting;
    const unconsumedTomatoString = taskLine.replace(/~~.*?~~/g, '').match(new RegExp(`[${fullTomatoEmoji}${halfTomatoEmoji}${quarterTomatoEmoji}]`, 'g'))?.join('') || '';
    return parseTomatoEmojisIntoMinutes(setting, unconsumedTomatoString);
}

export function updateTaskLineAfterElapsedMinutes(setting: PomodoroSetting, taskLine: string, workMinutes: number): string {
    const emojisPattern = `[\\+${setting.fullTomatoEmoji}${setting.halfTomatoEmoji}${setting.quarterTomatoEmoji}]`;
    
    const taskLineBody = taskLine.replace(/- \[ \] /, '');
    const consumedEmojisRegexp = new RegExp(`~~${emojisPattern}+~~`, 'g');

    const consumedPart = taskLineBody.match(consumedEmojisRegexp)?.join(' ') || '';
    const taskLineBodyWithoutConsumed = taskLineBody.replace(consumedEmojisRegexp, '').trim();

    const unconsumedEmojisRegexp = new RegExp(`${emojisPattern}+`, 'g');
    const unconsumedPart = taskLineBodyWithoutConsumed.match(unconsumedEmojisRegexp)?.join('') || '';

    const taskName = taskLineBodyWithoutConsumed.replace(unconsumedEmojisRegexp, '').trim();

    // Subtract work minutes from unconsumed part
    const updatedUnconsumedPart = subtractMinutesFromTomatoEmojis(setting, unconsumedPart, workMinutes);

    // Build updated task line
    let updatedTaskLine = '- [ ]';
    if (consumedPart) {
        updatedTaskLine += ` ${consumedPart}`;
    }
    if (updatedUnconsumedPart) {
        updatedTaskLine += ` ${updatedUnconsumedPart}`;
    }
    updatedTaskLine += ` ${taskName}`;
    return updatedTaskLine;
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
    const fullTomatoCount = Math.floor(input / setting.workMinutesPerTomato);
    input %= setting.workMinutesPerTomato;
    const halfTomatoCount = Math.floor(input / (setting.workMinutesPerTomato / 2));
    input %= (setting.workMinutesPerTomato / 2);
    const quarterTomatoCount = Math.round(input / (setting.workMinutesPerTomato / 4));

    return setting.fullTomatoEmoji.repeat(fullTomatoCount) +
           setting.halfTomatoEmoji.repeat(halfTomatoCount) +
           setting.quarterTomatoEmoji.repeat(quarterTomatoCount);
}

function subtractMinutesFromTomatoEmojis(setting: PomodoroSetting, tomatoString: string, minutes: number): string {
    const totalMinutes = parseTomatoEmojisIntoMinutes(setting, tomatoString);
    const consumedMinutes = Math.min(minutes, totalMinutes);
    const remainingMinutes = totalMinutes - consumedMinutes;

    if (minutes > totalMinutes) {
        const overMinutes = minutes - totalMinutes;
        const overTomatoes = formatMinutesIntoTomatoEmojis(setting, overMinutes);
        const totalTomatoes = formatMinutesIntoTomatoEmojis(setting, totalMinutes);
        return `~~${totalTomatoes}+${overTomatoes}~~`;
    }

    const consumedTomatoes = formatMinutesIntoTomatoEmojis(setting, consumedMinutes);
    const remainingTomatoes = formatMinutesIntoTomatoEmojis(setting, remainingMinutes);

    return `~~${consumedTomatoes}~~ ${remainingTomatoes}`.trim();
}

