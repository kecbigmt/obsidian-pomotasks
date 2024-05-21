import { describe, expect, it } from 'vitest';
import { getRemainingMinutesFromTaskBody, updateTaskBodyAfterElapsedMinutes } from './tomatoCalculation';

const setting = {
    fullTomatoEmoji: '🍅',
    halfTomatoEmoji: '🍓',
    quarterTomatoEmoji: '🍒',
    workMinutesPerTomato: 25
};

describe('getRemainingMinutesFromTaskBody', () => {
    it('should return the remaining minutes from a task line', () => {
        expect(getRemainingMinutesFromTaskBody(setting, '🍅 Reply to emails')).toBe(25);
        expect(getRemainingMinutesFromTaskBody(setting, '🍅🍓 Reply to emails')).toBe(37.5);
        expect(getRemainingMinutesFromTaskBody(setting, '🍅🍓🍒 Reply to emails')).toBe(43.75);
        expect(getRemainingMinutesFromTaskBody(setting, '~~🍅~~🍓 Reply to emails')).toBe(12.5);
        expect(getRemainingMinutesFromTaskBody(setting, '~~🍓~~🍒 Reply to emails')).toBe(6.25);
        expect(getRemainingMinutesFromTaskBody(setting, '~~🍅~~ ~~🍓~~ 🍒 Reply to emails')).toBe(6.25);
    });
});

describe('updateTaskBodyAfterElapsedMinutes', () => {
    it('should correctly update the task line for standard cases', () => {
        expect(updateTaskBodyAfterElapsedMinutes(setting, '🍅 Reply to emails', 13)).toBe('~~🍓~~ 🍓 Reply to emails');
        expect(updateTaskBodyAfterElapsedMinutes(setting, '🍅🍓 Reply to emails', 19)).toBe('~~🍓🍒~~ 🍓🍒 Reply to emails');
        expect(updateTaskBodyAfterElapsedMinutes(setting, '🍅🍓🍒 Reply to emails', 32)).toBe('~~🍅🍒~~ 🍓 Reply to emails');
    });

    it('should correctly update the task line with already consumed parts', () => {
        expect(updateTaskBodyAfterElapsedMinutes(setting, '~~🍓~~🍒 Reply to emails', 7)).toBe('~~🍓~~ ~~🍒~~ Reply to emails');
        expect(updateTaskBodyAfterElapsedMinutes(setting, '~~🍅~~ ~~🍓~~ 🍒 Reply to emails', 7)).toBe('~~🍅~~ ~~🍓~~ ~~🍒~~ Reply to emails');
        expect(updateTaskBodyAfterElapsedMinutes(setting, '~~🍒~~ 🍅🍓🍒 Reply to emails', 9)).toBe('~~🍒~~ ~~🍒~~ 🍅🍓 Reply to emails');

    });

    it('should handle over-consumption correctly', () => {
        expect(updateTaskBodyAfterElapsedMinutes(setting, '🍅 Reply to emails', 50)).toBe('~~🍅+🍅~~ Reply to emails');
    });

    it('should handle fully consumed task line with additional time', () => {
        expect(updateTaskBodyAfterElapsedMinutes(setting, '~~🍅~~ Reply to emails', 25)).toBe('~~🍅~~ ~~+🍅~~ Reply to emails');
        expect(updateTaskBodyAfterElapsedMinutes(setting, '~~🍅🍓🍒~~ Reply to emails', 25)).toBe('~~🍅🍓🍒~~ ~~+🍅~~ Reply to emails');
    });

    it('should handle no estimated line correctly', () => {
        expect(updateTaskBodyAfterElapsedMinutes(setting, 'Reply to emails', 25)).toBe('~~+🍅~~ Reply to emails');
    });

    it('should handle zero minutes correctly', () => {
        expect(updateTaskBodyAfterElapsedMinutes(setting, '🍅 Reply to emails', 0)).toBe('🍅 Reply to emails');
    });

    it('should handle negative minutes correctly', () => {
        expect(updateTaskBodyAfterElapsedMinutes(setting, '🍅 Reply to emails', -25)).toBe('🍅 Reply to emails');
    });

    it('should handle small minutes correctly', () => {
        expect(updateTaskBodyAfterElapsedMinutes(setting, '🍅 Reply to emails', 1)).toBe('🍅 Reply to emails');
    });
});