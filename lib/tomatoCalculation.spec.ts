import { describe, expect, it } from 'vitest';
import { getRemainingMinutesFromTaskLine, updateTaskLineAfterElapsedMinutes } from './tomatoCalculation';

const setting = {
    fullTomatoEmoji: '🍅',
    halfTomatoEmoji: '🍓',
    quarterTomatoEmoji: '🍒',
    workMinutesPerTomato: 25
};

describe('getRemainingMinutesFromTaskLine', () => {
    it('should return the remaining minutes from a task line', () => {
        expect(getRemainingMinutesFromTaskLine(setting, '- [ ] 🍅 Reply to emails')).toBe(25);
        expect(getRemainingMinutesFromTaskLine(setting, '- [ ] 🍅🍓 Reply to emails')).toBe(37.5);
        expect(getRemainingMinutesFromTaskLine(setting, '- [ ] 🍅🍓🍒 Reply to emails')).toBe(43.75);
        expect(getRemainingMinutesFromTaskLine(setting, '- [ ] ~~🍅~~🍓 Reply to emails')).toBe(12.5);
        expect(getRemainingMinutesFromTaskLine(setting, '- [ ] ~~🍓~~🍒 Reply to emails')).toBe(6.25);
        expect(getRemainingMinutesFromTaskLine(setting, '- [ ] ~~🍅~~ ~~🍓~~ 🍒 Reply to emails')).toBe(6.25);
    });
});

describe('updateTaskLineAfterElapsedMinutes', () => {
    it('should correctly update the task line for standard cases', () => {
        expect(updateTaskLineAfterElapsedMinutes(setting, '- [ ] 🍅 Reply to emails', 12.5)).toBe('- [ ] ~~🍓~~ 🍓 Reply to emails');
        expect(updateTaskLineAfterElapsedMinutes(setting, '- [ ] 🍅🍓 Reply to emails', 18.75)).toBe('- [ ] ~~🍓🍒~~ 🍓🍒 Reply to emails');
        expect(updateTaskLineAfterElapsedMinutes(setting, '- [ ] 🍅🍓🍒 Reply to emails', 31.25)).toBe('- [ ] ~~🍅🍒~~ 🍓 Reply to emails');
    });

    it('should correctly update the task line with already consumed parts', () => {
        expect(updateTaskLineAfterElapsedMinutes(setting, '- [ ] ~~🍓~~🍒 Reply to emails', 6.25)).toBe('- [ ] ~~🍓~~ ~~🍒~~ Reply to emails');
        expect(updateTaskLineAfterElapsedMinutes(setting, '- [ ] ~~🍅~~ ~~🍓~~ 🍒 Reply to emails', 6.25)).toBe('- [ ] ~~🍅~~ ~~🍓~~ ~~🍒~~ Reply to emails');
    });

    it('should handle over-consumption correctly', () => {
        expect(updateTaskLineAfterElapsedMinutes(setting, '- [ ] 🍅 Reply to emails', 50)).toBe('- [ ] ~~🍅+🍅~~ Reply to emails');
    });

    it('should handle fully consumed task line with additional time', () => {
        expect(updateTaskLineAfterElapsedMinutes(setting, '- [ ] ~~🍅~~ Reply to emails', 25)).toBe('- [ ] ~~🍅~~ ~~+🍅~~ Reply to emails');
        expect(updateTaskLineAfterElapsedMinutes(setting, '- [ ] ~~🍅🍓🍒~~ Reply to emails', 25)).toBe('- [ ] ~~🍅🍓🍒~~ ~~+🍅~~ Reply to emails');
    });

    it('should handle no estimated line correctly', () => {
        expect(updateTaskLineAfterElapsedMinutes(setting, '- [ ] Reply to emails', 25)).toBe('- [ ] ~~+🍅~~ Reply to emails');
    });
});