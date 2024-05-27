import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetTimer, startNewTimer, pauseTimer, resumeTimer, markTimerAsNotified } from './TimerState';

const fakeTime = new Date('2024-01-01T00:00:00Z');

describe('TimerState', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

    describe('resetTimer', () => {
        it('should return a stopped state', () => {
            const state = resetTimer();
            expect(state).toEqual({
                type: 'stopped',
                endsAt: null,
                pauseAt: null,
                notificationTriggered: false,
            });
        });
    });

	describe('startNewTimer', () => {
		it('should return a running state', () => {
            vi.setSystemTime(fakeTime);
			const state = startNewTimer(1500000);
			expect(state).toEqual({
				type: 'running',
				endsAt: fakeTime.getTime() + 1500000,
				pauseAt: null,
				notificationTriggered: false,
			});
		});
	});

	describe('pauseTimer', () => {
		it('should return a paused state', () => {
            vi.setSystemTime(fakeTime);
			const runningState = startNewTimer(1500000);

            vi.setSystemTime(fakeTime.getTime() + 2000);
			const state = pauseTimer(runningState);

			expect(state).toEqual({
				type: 'paused',
				endsAt: fakeTime.getTime() + 1500000,
				pauseAt: fakeTime.getTime() + 2000,
				notificationTriggered: false,
			});
		});
	});

	describe('resumeTimer', () => {
		it('should return a running state', () => {
            vi.setSystemTime(fakeTime);
            const runningState = startNewTimer(1500000);

            vi.setSystemTime(fakeTime.getTime() + 2000);
			const pausedState = pauseTimer(runningState);

            vi.setSystemTime(fakeTime.getTime() + 5000);
			const state = resumeTimer(pausedState);

			expect(state).toEqual({
				type: 'running',
				endsAt: fakeTime.getTime() + 1500000 - 2000 + 5000,
				pauseAt: null,
				notificationTriggered: false,
			});
		});
	});

	describe('markTimerAsNotified', () => {
		it('should return a state with notificationTriggered set to true', () => {
            vi.setSystemTime(fakeTime);
			const state = startNewTimer(1500000);
			const newState = markTimerAsNotified(state);
			expect(newState).toEqual({
				type: 'running',
				endsAt: fakeTime.getTime() + 1500000,
				pauseAt: null,
				notificationTriggered: true,
			});
		});
	});
});
