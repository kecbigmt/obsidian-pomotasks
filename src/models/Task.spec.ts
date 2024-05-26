import { describe, expect, it } from 'vitest';
import { constructTaskFromLine, formatTaskToLine, substractTomatoCountFromTask } from './Task';

describe('Task', () => {
	// Arrange
	const emojiSetting = {
		fullTomato: '🍅',
		halfTomato: '🍓',
		quarterTomato: '🍒',
	};

	describe('constructTaskFromLine', () => {
		it('should construct a task from a raw line', () => {
			// Act
			const task = constructTaskFromLine(emojiSetting, '- [ ] 🍅🍓 Reply to emails', 'path/to/file');

			// Assert
			expect(task).toEqual({
				name: 'Reply to emails',
				remainingTomatoCount: 1.5,
				completedTomatoCount: 0,
				overCompletedTomatoCount: 0,
				filePath: 'path/to/file',
				rawLine: '- [ ] 🍅🍓 Reply to emails',
			});
		});

		it('should handle a task with no emoji', () => {
			// Act
			const task = constructTaskFromLine(emojiSetting, '- [ ] Reply to emails', 'path/to/file');

			// Assert
			expect(task).toEqual({
				name: 'Reply to emails',
				remainingTomatoCount: 0,
				completedTomatoCount: 0,
				overCompletedTomatoCount: 0,
				filePath: 'path/to/file',
				rawLine: '- [ ] Reply to emails',
			});
		});

		it('should handle a task with completed tomatoes', () => {
			// Act
			const task = constructTaskFromLine(emojiSetting, '- [ ] ~~🍅~~ 🍓 Reply to emails', 'path/to/file');

			// Assert
			expect(task).toEqual({
				name: 'Reply to emails',
				remainingTomatoCount: 0.5,
				completedTomatoCount: 1,
				overCompletedTomatoCount: 0,
				filePath: 'path/to/file',
				rawLine: '- [ ] ~~🍅~~ 🍓 Reply to emails',
			});
		});

		it('should handle a task with over-consumed tomatoes', () => {
			// Act
			const task = constructTaskFromLine(emojiSetting, '- [ ] ~~🍅+🍅~~ Reply to emails', 'path/to/file');

			// Assert
			expect(task).toEqual({
				name: 'Reply to emails',
				remainingTomatoCount: 0,
				completedTomatoCount: 1,
				overCompletedTomatoCount: 1,
				filePath: 'path/to/file',
				rawLine: '- [ ] ~~🍅+🍅~~ Reply to emails',
			});
		});

        it('should handle a task with indent', () => {
            // Act
            const task = constructTaskFromLine(emojiSetting, '  - [ ] 🍅 Reply to emails', 'path/to/file');

            // Assert
            expect(task).toEqual({
                name: 'Reply to emails',
                remainingTomatoCount: 1,
                completedTomatoCount: 0,
                overCompletedTomatoCount: 0,
                filePath: 'path/to/file',
                rawLine: '  - [ ] 🍅 Reply to emails',
            });
        })
	});

	describe('formatTaskToLine', () => {
        it('should format a task to a raw line', () => {
            // Arrange
            const task = {
                name: 'Reply to emails',
                remainingTomatoCount: 1.5,
                completedTomatoCount: 0,
                overCompletedTomatoCount: 0,
                filePath: 'path/to/file',
                rawLine: '- [ ] 🍅🍓 Reply to emails',
            };

            // Act
            const formattedLine = formatTaskToLine(emojiSetting, task);

            // Assert
            expect(formattedLine).toBe('- [ ] 🍅🍓 Reply to emails');
        });

        it('should handle a task with no emoji', () => {
            // Arrange
            const task = {
                name: 'Reply to emails',
                remainingTomatoCount: 0,
                completedTomatoCount: 0,
                overCompletedTomatoCount: 0,
                filePath: 'path/to/file',
                rawLine: '- [ ] Reply to emails',
            };

            // Act
            const formattedLine = formatTaskToLine(emojiSetting, task);

            // Assert
            expect(formattedLine).toBe('- [ ] Reply to emails');
        });

        it('should handle a task with completed tomatoes', () => {
            // Arrange
            const task = {
                name: 'Reply to emails',
                remainingTomatoCount: 0.5,
                completedTomatoCount: 1,
                overCompletedTomatoCount: 0,
                filePath: 'path/to/file',
                rawLine: '- [ ] ~~🍅~~ 🍓 Reply to emails',
            };

            // Act
            const formattedLine = formatTaskToLine(emojiSetting, task);

            // Assert
            expect(formattedLine).toBe('- [ ] ~~🍅~~ 🍓 Reply to emails');
        });

        it('should handle a task with over-consumed tomatoes', () => {
            // Arrange
            const task = {
                name: 'Reply to emails',
                remainingTomatoCount: 0,
                completedTomatoCount: 1,
                overCompletedTomatoCount: 1,
                filePath: 'path/to/file',
                rawLine: '- [ ] ~~🍅+🍅~~ Reply to emails',
            };

            // Act
            const formattedLine = formatTaskToLine(emojiSetting, task);

            // Assert
            expect(formattedLine).toBe('- [ ] ~~🍅+🍅~~ Reply to emails');
        });

        it('should handle a task with no remaining tomatoes', () => {
            // Arrange
            const task = {
                name: 'Reply to emails',
                remainingTomatoCount: 0,
                completedTomatoCount: 1,
                overCompletedTomatoCount: 0,
                filePath: 'path/to/file',
                rawLine: '- [ ] ~~🍅~~ Reply to emails',
            };

            // Act
            const formattedLine = formatTaskToLine(emojiSetting, task);

            // Assert
            expect(formattedLine).toBe('- [ ] ~~🍅~~ Reply to emails');
        });

        it('should handle a task with no completed tomatoes', () => {
            // Arrange
            const task = {
                name: 'Reply to emails',
                remainingTomatoCount: 1,
                completedTomatoCount: 0,
                overCompletedTomatoCount: 0,
                filePath: 'path/to/file',
                rawLine: '- [ ] 🍅 Reply to emails',
            };

            // Act
            const formattedLine = formatTaskToLine(emojiSetting, task);

            // Assert
            expect(formattedLine).toBe('- [ ] 🍅 Reply to emails');
        });

        it('should keep indent in rawLine', () => {
            // Arrange
            const task = {
                name: 'Reply to emails',
                remainingTomatoCount: 1,
                completedTomatoCount: 0,
                overCompletedTomatoCount: 0,
                filePath: 'path/to/file',
                rawLine: '  - [ ] 🍅 Reply to emails',
            };

            // Act
            const formattedLine = formatTaskToLine(emojiSetting, task);

            // Assert
            expect(formattedLine).toBe('  - [ ] 🍅 Reply to emails');
        })
    });

    describe("substractTomatoCountFromTask", () => {
        it("should substract the given tomato count from the task", () => {
            // Arrange
            const task = {
                name: 'Reply to emails',
                remainingTomatoCount: 1.5,
                completedTomatoCount: 0,
                overCompletedTomatoCount: 0,
                filePath: 'path/to/file',
                rawLine: '- [ ] 🍅🍓 Reply to emails',
            };

            // Act
            const newTask = substractTomatoCountFromTask(task, 1);

            // Assert
            expect(newTask).toEqual({
                name: 'Reply to emails',
                remainingTomatoCount: 0.5,
                completedTomatoCount: 1,
                overCompletedTomatoCount: 0,
                filePath: 'path/to/file',
                rawLine: '- [ ] 🍅🍓 Reply to emails',
            });
        });

        it("should handle over-consumption correctly", () => {
            // Arrange
            const task = {
                name: 'Reply to emails',
                remainingTomatoCount: 0.5,
                completedTomatoCount: 1,
                overCompletedTomatoCount: 0,
                filePath: 'path/to/file',
                rawLine: '- [ ] ~~🍅+🍅~~ Reply to emails',
            };

            // Act
            const newTask = substractTomatoCountFromTask(task, 1);

            // Assert
            expect(newTask).toEqual({
                name: 'Reply to emails',
                remainingTomatoCount: 0,
                completedTomatoCount: 1.5,
                overCompletedTomatoCount: 0.5,
                filePath: 'path/to/file',
                rawLine: '- [ ] ~~🍅+🍅~~ Reply to emails',
            });
        });

        it("should handle no remaining tomatoes correctly", () => {
            // Arrange
            const task = {
                name: 'Reply to emails',
                remainingTomatoCount: 0,
                completedTomatoCount: 1,
                overCompletedTomatoCount: 0,
                filePath: 'path/to/file',
                rawLine: '- [ ] ~~🍅~~ Reply to emails',
            };

            // Act
            const newTask = substractTomatoCountFromTask(task, 1);

            // Assert
            expect(newTask).toEqual({
                name: 'Reply to emails',
                remainingTomatoCount: 0,
                completedTomatoCount: 1,
                overCompletedTomatoCount: 1,
                filePath: 'path/to/file',
                rawLine: '- [ ] ~~🍅~~ Reply to emails',
            });
        });

        it("should round down number to the nearest quarter", () => {
            // Arrange
            const task = {
                name: 'Reply to emails',
                remainingTomatoCount: 1.5,
                completedTomatoCount: 0,
                overCompletedTomatoCount: 0,
                filePath: 'path/to/file',
                rawLine: '- [ ] 🍅🍓 Reply to emails',
            };

            // Act
            const newTask = substractTomatoCountFromTask(task, 0.3);

            // Assert
            expect(newTask).toEqual({
                name: 'Reply to emails',
                remainingTomatoCount: 1.25,
                completedTomatoCount: 0.25,
                overCompletedTomatoCount: 0,
                filePath: 'path/to/file',
                rawLine: '- [ ] 🍅🍓 Reply to emails',
            });
        });
    });
});
