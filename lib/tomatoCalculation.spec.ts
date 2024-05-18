import { describe, expect, it } from 'vitest';
import { getRemainingMinutesFromTaskLine, updateTaskLineAfterElapsedMinutes, formatMinutesIntoTomatoEmojis, parseTomatoEmojisIntoMinutes, subtractMinutesFromTomatoEmojis } from './tomatoCalculation';

const setting = {
    fullTomatoEmoji: '🍅',
    halfTomatoEmoji: '🍓',
    quarterTomatoEmoji: '🍒',
    workMinutesPerTomato: 25
};

describe('parseTomatoEmojisIntoMinutes', () => {
    it('should convert emoji string to minutes', () => {
        expect(parseTomatoEmojisIntoMinutes(setting, '🍅🍓🍒')).toBe(25 + 12.5 + 6.25);
    });
});

describe('formatMinutesIntoTomatoEmojis', () => {
    it('should convert minutes to emoji string', () => {
        expect(formatMinutesIntoTomatoEmojis(setting, 43.75)).toBe('🍅🍓🍒');
    });

    it('should handle non-divisible times correctly', () => {
        expect(formatMinutesIntoTomatoEmojis(setting, 20)).toBe('🍓🍒');
    });
});

describe('subtractMinutesFromTomatoEmojis', () => {
    it('should correctly subtract minutes from emoji string', () => {
        expect(subtractMinutesFromTomatoEmojis(setting, '🍅🍓🍒', 25)).toBe('~~🍅~~ 🍓🍒');
        expect(subtractMinutesFromTomatoEmojis(setting, '🍅🍓🍒', 12.5)).toBe('~~🍓~~ 🍅🍒');
        expect(subtractMinutesFromTomatoEmojis(setting, '🍅🍓🍒', 6.25)).toBe('~~🍒~~ 🍅🍓');
        expect(subtractMinutesFromTomatoEmojis(setting, '🍅🍓🍒', 31.25)).toBe('~~🍅🍒~~ 🍓');
    });
    
    it('should handle over-consumption correctly', () => {
        expect(subtractMinutesFromTomatoEmojis(setting, '🍅', 50)).toBe('~~🍅+🍅~~');
        expect(subtractMinutesFromTomatoEmojis(setting, '🍅🍓', 50)).toBe('~~🍅🍓+🍓~~');
    });

    it('should handle empty string input correctly', () => {
        expect(subtractMinutesFromTomatoEmojis(setting, '', 50)).toBe('~~+🍅🍅~~');
    });
});


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