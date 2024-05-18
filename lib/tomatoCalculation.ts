export type PomodoroSetting = {
    fullTomatoEmoji: string;
    halfTomatoEmoji: string;
    quarterTomatoEmoji: string;
    workMinutesPerTomato: number;
};

export function parseTomatoEmojisIntoMinutes(setting: PomodoroSetting, input: string): number {
    const fullTomatoCount = (input.match(new RegExp(setting.fullTomatoEmoji, 'g')) || []).length;
    const halfTomatoCount = (input.match(new RegExp(setting.halfTomatoEmoji, 'g')) || []).length;
    const quarterTomatoCount = (input.match(new RegExp(setting.quarterTomatoEmoji, 'g')) || []).length;
    return fullTomatoCount * setting.workMinutesPerTomato +
           halfTomatoCount * (setting.workMinutesPerTomato / 2) +
           quarterTomatoCount * (setting.workMinutesPerTomato / 4);
}

export function formatMinutesIntoTomatoEmojis(setting: PomodoroSetting, input: number): string {
    const fullTomatoCount = Math.floor(input / setting.workMinutesPerTomato);
    input %= setting.workMinutesPerTomato;
    const halfTomatoCount = Math.floor(input / (setting.workMinutesPerTomato / 2));
    input %= (setting.workMinutesPerTomato / 2);
    const quarterTomatoCount = Math.round(input / (setting.workMinutesPerTomato / 4));

    return setting.fullTomatoEmoji.repeat(fullTomatoCount) +
           setting.halfTomatoEmoji.repeat(halfTomatoCount) +
           setting.quarterTomatoEmoji.repeat(quarterTomatoCount);
}

export function subtractMinutesFromTomatoString(setting: PomodoroSetting, tomatoString: string, minutes: number): string {
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
