import { describe, expect, it } from 'vitest';
import { formatMinutesIntoTomatoEmojis, parseTomatoEmojisIntoMinutes, subtractMinutesFromTomatoString } from './tomatoCalculation';

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

describe('subtractMinutesFromTomatoString', () => {
    it('should correctly subtract minutes from emoji string', () => {
        expect(subtractMinutesFromTomatoString(setting, '🍅🍓🍒', 25)).toBe('~~🍅~~ 🍓🍒');
        expect(subtractMinutesFromTomatoString(setting, '🍅🍓🍒', 12.5)).toBe('~~🍓~~ 🍅🍒');
        expect(subtractMinutesFromTomatoString(setting, '🍅🍓🍒', 6.25)).toBe('~~🍒~~ 🍅🍓');
        expect(subtractMinutesFromTomatoString(setting, '🍅🍓🍒', 31.25)).toBe('~~🍅🍒~~ 🍓');
    });
    
    it('should handle over-consumption correctly', () => {
        expect(subtractMinutesFromTomatoString(setting, '🍅', 50)).toBe('~~🍅+🍅~~');
        expect(subtractMinutesFromTomatoString(setting, '🍅🍓', 50)).toBe('~~🍅🍓+🍓~~');
    });

    it('should handle empty string input correctly', () => {
        expect(subtractMinutesFromTomatoString(setting, '', 50)).toBe('~~+🍅🍅~~');
    });
});