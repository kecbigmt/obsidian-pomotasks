import { App, Plugin, PluginSettingTab, Setting, TFile, ItemView, WorkspaceLeaf, MarkdownRenderer, setIcon, TFolder, Notice } from 'obsidian';
import type { Unsubscriber } from 'svelte/store';

import { updateTaskBodyAfterElapsedMinutes, getRemainingMinutesFromTaskBody } from './lib/tomatoCalculation';
import TimerComponent from './Timer.svelte';
import store from './store';

interface ChecklistPluginSettings {
	autoUpdate: boolean;
	tomatoEmoji: string;
	halfTomatoEmoji: string;
	quarterTomatoEmoji: string;
	workDuration: number; // in minutes
	breakDuration: number; // in minutes
	folderPath: string; // folder to search for checklists
}

const DEFAULT_SETTINGS: ChecklistPluginSettings = {
	autoUpdate: true,
	tomatoEmoji: '🍅',
	halfTomatoEmoji: '🍓',
	quarterTomatoEmoji: '🍒',
	workDuration: 25,
	breakDuration: 5,
	folderPath: ''
};

const CHECKLIST_VIEW_TYPE = 'checklist-view';

export default class ChecklistPlugin extends Plugin {
	settings: ChecklistPluginSettings;
	statusBarItem: HTMLElement;

	async onload() {
		await this.loadSettings();

		this.registerView(
			CHECKLIST_VIEW_TYPE,
			(leaf) => new ChecklistView(leaf, this)
		);

		this.addSettingTab(new ChecklistSettingTab(this.app, this));

		if (this.settings.autoUpdate) {
			const updateHandler = this.debounce(() => this.updateActiveChecklistView(), 300);
			this.registerEvent(this.app.vault.on('modify', updateHandler));
			this.registerEvent(this.app.vault.on('create', updateHandler));
			this.registerEvent(this.app.vault.on('delete', updateHandler));
		}

		this.activateView();
		this.statusBarItem = this.addStatusBarItem();
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(CHECKLIST_VIEW_TYPE);
	}

	async activateView() {
		this.app.workspace.detachLeavesOfType(CHECKLIST_VIEW_TYPE);

		let rightLeaf = this.app.workspace.getRightLeaf(false);
		if (!rightLeaf) {
			rightLeaf = this.app.workspace.createLeafBySplit(this.app.workspace.getLeavesOfType('empty')[0], 'horizontal');
		}

		await rightLeaf.setViewState({
			type: CHECKLIST_VIEW_TYPE,
			active: true,
		});

		this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(CHECKLIST_VIEW_TYPE)[0]);
	}

	async updateActiveChecklistView() {
		const view = this.app.workspace.getLeavesOfType(CHECKLIST_VIEW_TYPE).first()?.view as ChecklistView;
		if (view) {
			view.updateChecklist();
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	debounce(func: () => void, wait: number): () => void {
		let timeout: number;
		return () => {
			clearTimeout(timeout);
			timeout = window.setTimeout(func, wait);
		};
	}
}

class Task {
	task: string;
	path: string;
	line: string;
	private _elapsedSeconds: number = 0;
	private _timerInterval: number | null = null;
	private  _onDeactivate: (self: Task, elapsedSeconds: number) => Promise<void>;

	constructor(task: string, path: string, line: string, onDeactivate: (self: Task, elapsedSeconds: number) => Promise<void>) {
		this.task = task;
		this.path = path;
		this.line = line;
		this._onDeactivate = onDeactivate;
	}

	activate() {
		if (this._timerInterval) return;
		this._timerInterval = window.setInterval(() => this.updateElapsedTime(1), 1000);
	}

	async deactivate() {
		if (this._timerInterval) window.clearInterval(this._timerInterval);
		await this._onDeactivate(this, this._elapsedSeconds);
		this._elapsedSeconds = 0;
	}

	pause() {
		if (this._timerInterval) window.clearInterval(this._timerInterval);
	}

	reset() {
		this._elapsedSeconds = 0;
		if (this._timerInterval) window.clearInterval(this._timerInterval);
	}

	private updateElapsedTime(seconds: number) {
		this._elapsedSeconds += seconds;
	}
}

class ChecklistView extends ItemView {
	private checklistContainer: HTMLElement;
	private selectedTaskContainer: HTMLElement;
	private timerContainer: HTMLElement;
	private timerComponent: TimerComponent | undefined;
	private plugin: ChecklistPlugin;
	private selectedTaskBody: string | null = null;
	private selectedTaskLabel: HTMLElement;
	private clearTaskButton: HTMLAnchorElement;
	private fileItems: { fileName: string, filePath: string, items: Task[], tomatoCount: number }[] = [];
	private timerStatus: 'running' | 'paused' | 'stopped' = 'stopped';
	private unsubscribeTimerStatus: Unsubscriber | null = null;
	private sessionMode: 'work' | 'break' = 'work';
	private unsubscribeSessionMode: Unsubscriber | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: ChecklistPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.contentEl.addClass('checklist-view');
		this.timerContainer = this.contentEl.createDiv({ cls: 'timer-container' });
		this.selectedTaskContainer = this.contentEl.createDiv({ cls: 'selected-task-container' });
		this.checklistContainer = this.contentEl.createDiv({ cls: 'checklist-container' });
		this.updateChecklist = this.updateChecklist.bind(this);
	}

	getViewType() {
		return CHECKLIST_VIEW_TYPE;
	}

	getDisplayText() {
		return "Pomotasks";
	}

	getIcon(): string {
		return 'book-check';
	}

	async onOpen() {
		store.plugin.set(this.plugin);
		this.unsubscribeTimerStatus = store.timerStatus.subscribe((status) => {
			this.timerStatus = status;
		});
		this.unsubscribeSessionMode = store.sessionMode.subscribe((mode) => {
			this.sessionMode = mode;
		});

		this.timerComponent = new TimerComponent({
			target: this.timerContainer,
			props: {
				workMinutes: this.plugin.settings.workDuration,
				breakMinutes: this.plugin.settings.breakDuration
			}
		});
		this.timerComponent.$on('timer-start', ({ detail: { sessionMode } }) => {
			const selectedTask = this.findSelectedTask();
			if (selectedTask && sessionMode === 'work') {
				selectedTask.activate();
			}
		});
		this.timerComponent.$on('timer-pause', () => {
			this.findSelectedTask()?.pause();
		});
		this.timerComponent.$on('timer-reset', () => {
			this.findSelectedTask()?.reset();
		});
		this.timerComponent.$on('timer-skip', () => {
			this.findSelectedTask()?.deactivate();
		});
		this.timerComponent.$on('timer-run-out', ({ detail: { sessionMode } }) => {
			const message = sessionMode === 'work' ? 'Work session ended' : 'Break session ended';
				if (window.Notification && Notification.permission === 'granted') {
					new Notification(message);
				} else {
					new Notice(message);
				}
		});

		this.createTimerUI();
		this.updateChecklist();
	}

	async onClose() {
		this.timerComponent?.$destroy();
		this.unsubscribeTimerStatus?.();
		this.unsubscribeSessionMode?.();
	}

	private createTimerUI() {
		this.selectedTaskLabel = this.selectedTaskContainer.createEl('div', { text: 'No task selected', cls: 'selected-task-label' });
		this.clearTaskButton = this.selectedTaskContainer.createEl('a', { cls: 'clickable-icon', title: 'Cancel' });
		setIcon(this.clearTaskButton, 'x-circle');
		this.clearTaskButton.onclick = () => this.clearSelectedTask();
		this.clearTaskButton.hide();
	}

	async updateChecklist() {
		const files = this.plugin.app.vault.getMarkdownFiles();
		const { tomatoEmoji, halfTomatoEmoji, quarterTomatoEmoji, workDuration, breakDuration, folderPath } = this.plugin.settings;
		this.fileItems = [];

		for (const file of files) {
			if (folderPath && !file.path.startsWith(folderPath)) {
				continue;
			}

			try {
				const content = await this.plugin.app.vault.read(file);
				const lines = content.split('\n');
				let items: Task[] = [];
				let tomatoCount = 0;

				for (const line of lines) {
					if (line.match(/^\s*-\s*\[\s\]/)) {
						const taskBody = line.trim().slice(6);
						const filePath = file.path;
						const task = new Task(taskBody, filePath, line, async (self, elapsedSeconds) => {
							if (taskBody !== this.selectedTaskBody) return;
							const file = this.app.vault.getAbstractFileByPath(filePath) as TFile;
							if (file) {
								const content = await this.app.vault.read(file);
								const setting = {
									fullTomatoEmoji: this.plugin.settings.tomatoEmoji,
									halfTomatoEmoji: this.plugin.settings.halfTomatoEmoji,
									quarterTomatoEmoji: this.plugin.settings.quarterTomatoEmoji,
									workMinutesPerTomato: this.plugin.settings.workDuration
								};
								const newTask = updateTaskBodyAfterElapsedMinutes(setting, taskBody, elapsedSeconds / 60);
								if (newTask === taskBody) return;
								
								const newLine = '- [ ] ' + newTask;
								self.task = newTask;
								self.line = newLine;
								this.selectedTaskBody = newTask;
								this.selectedTaskLabel.empty();
								await MarkdownRenderer.render(this.plugin.app, newTask, this.selectedTaskLabel, filePath, this);
								const updatedContent = content.replace(line, newLine);
								await this.app.vault.modify(file, updatedContent);
							}
						});
						items.push(task);
						const setting = {
							fullTomatoEmoji: tomatoEmoji,
							halfTomatoEmoji: halfTomatoEmoji,
							quarterTomatoEmoji: quarterTomatoEmoji,
							workMinutesPerTomato: workDuration
						};
						tomatoCount += getRemainingMinutesFromTaskBody(setting, line) / workDuration;
					}
				}

				if (items.length > 0) {
					this.fileItems.push({ fileName: file.name.replace(/\.[^/.]+$/, ""), filePath: file.path, items, tomatoCount });
				}
			} catch (error) {
				console.error(`Error reading file ${file.path}:`, error);
			}
		}

		this.fileItems = this.fileItems.sort((a, b) => a.fileName.localeCompare(b.fileName));
		this.checklistContainer.empty();

		this.fileItems.forEach(fileItem => {
			const { fileName, filePath, items, tomatoCount } = fileItem;
			const totalMinutes = tomatoCount * (workDuration + breakDuration);
			const hours = Math.floor(totalMinutes / 60);
			const minutes = totalMinutes % 60;

			const fileSection = this.checklistContainer.createDiv({ cls: 'file-section' });

			const fileHeader = fileSection.createDiv({ cls: 'file-section-header' });
			fileHeader.createEl('h2', { text: fileName, cls: 'file-section-title' });

			const fileIcon = fileHeader.createEl('span', { cls: 'file-section-icon' });
			fileIcon.addEventListener('click', () => {
				const leaf = this.plugin.app.workspace.getLeaf();
				const file = this.plugin.app.vault.getAbstractFileByPath(filePath) as TFile;
				if (file) {
					leaf.openFile(file);
				}
			});
			fileIcon.addClass('clickable-icon');
			setIcon(fileIcon, 'chevron-right');
			fileSection.createEl('div', { text: `Total: ${tomatoEmoji}x${tomatoCount} (${hours}h ${minutes}m)` });

			const checklistContent = fileSection.createDiv({ cls: 'checklist-list' });

			items.forEach(async (item) => {
				await this.renderChecklistItem(item, checklistContent);
			});
		});

		if (!this.findSelectedTask()) {
			this.clearSelectedTask();
		}
	}

	async renderChecklistItem(item: Task, container: HTMLElement) {
		const itemEl = container.createEl('div', { cls: 'checklist-item' });

		const labelEl = itemEl.createEl('label', { cls: 'checklist-item-label' });
		const checkbox = labelEl.createEl('input');
		checkbox.type = 'checkbox';
		checkbox.onclick = async () => {
			await this.clearSelectedTask();
			await this.markItemAsDone(item);
		};

		const markdownContainer = labelEl.createDiv();
		await MarkdownRenderer.render(this.plugin.app, item.task, markdownContainer, item.path, this);

		const selectButton = itemEl.createEl('a', { cls: 'clickable-icon', title: 'Focus on' });
		setIcon(selectButton, 'circle-dot');
		selectButton.onclick = () => this.selectTask(item);
	}

	async markItemAsDone(item: Task) {
		try {
			const file = this.plugin.app.vault.getAbstractFileByPath(item.path) as TFile;

			if (file) {
				const content = await this.plugin.app.vault.read(file);
				const updatedContent = content.replace(item.line, item.line.replace('[ ]', '[x]'));
				await this.plugin.app.vault.modify(file, updatedContent);
				this.updateChecklist();
			}
		} catch (error) {
			console.error(`Error updating file ${item.path}:`, error);
		}
	}

	private async selectTask(item: Task) {
		await this.findSelectedTask()?.deactivate();

		this.selectedTaskBody = item.task;
		this.selectedTaskLabel.empty();
		await MarkdownRenderer.render(this.plugin.app, item.task, this.selectedTaskLabel, item.path, this);
		this.clearTaskButton.show();
		if (this.timerStatus === 'running' && this.sessionMode === 'work') {
			this.findSelectedTask()?.activate();
		}
	}

	private async clearSelectedTask() {
		await this.findSelectedTask()?.deactivate();
		this.selectedTaskBody = null;
		this.selectedTaskLabel.textContent = 'No task selected';
		this.clearTaskButton.hide();
	}

	private findSelectedTask() {
		return this.fileItems.flatMap(fileItem => fileItem.items).find(item => item.task === this.selectedTaskBody);
	}
}

class ChecklistSettingTab extends PluginSettingTab {
	plugin: ChecklistPlugin;

	constructor(app: App, plugin: ChecklistPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getFolderOptions(): string[] {
		const folderPaths: string[] = [];
		this.plugin.app.vault.getAllLoadedFiles().forEach((file) => {
			if (file instanceof TFolder) {
				folderPaths.push(file.path);
			}
		});
		return folderPaths;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Checklist Plugin Settings' });

		new Setting(containerEl)
			.setName('Auto Update')
			.setDesc('Automatically update checklist when files are modified.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoUpdate)
				.onChange(async (value) => {
					this.plugin.settings.autoUpdate = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Tomato Emoji')
			.setDesc('Emoji to use for representing a full Pomodoro session.')
			.addText(text => text
				.setPlaceholder('Enter emoji')
				.setValue(this.plugin.settings.tomatoEmoji)
				.onChange(async (value) => {
					this.plugin.settings.tomatoEmoji = value || '🍅';
					await this.plugin.saveSettings();
					this.plugin.updateActiveChecklistView();
				}));

		new Setting(containerEl)
			.setName('Half Tomato Emoji')
			.setDesc('Emoji to use for representing half a Pomodoro session.')
			.addText(text => text
				.setPlaceholder('Enter emoji')
				.setValue(this.plugin.settings.halfTomatoEmoji)
				.onChange(async (value) => {
					this.plugin.settings.halfTomatoEmoji = value || '🍓';
					await this.plugin.saveSettings();
					this.plugin.updateActiveChecklistView();
				}));

		new Setting(containerEl)
			.setName('Quarter Tomato Emoji')
			.setDesc('Emoji to use for representing a quarter of a Pomodoro session.')
			.addText(text => text
				.setPlaceholder('Enter emoji')
				.setValue(this.plugin.settings.quarterTomatoEmoji)
				.onChange(async (value) => {
					this.plugin.settings.quarterTomatoEmoji = value || '🍒';
					await this.plugin.saveSettings();
					this.plugin.updateActiveChecklistView();
				}));

		new Setting(containerEl)
			.setName('Work Duration')
			.setDesc('Duration of a work session in minutes.')
			.addText(text => text
				.setPlaceholder('Enter minutes')
				.setValue(this.plugin.settings.workDuration.toString())
				.onChange(async (value) => {
					const numValue = parseInt(value, 10);
					if (!isNaN(numValue)) {
						this.plugin.settings.workDuration = numValue;
						await this.plugin.saveSettings();
						this.plugin.updateActiveChecklistView();
					}
				}));

		new Setting(containerEl)
			.setName('Break Duration')
			.setDesc('Duration of a break session in minutes.')
			.addText(text => text
				.setPlaceholder('Enter minutes')
				.setValue(this.plugin.settings.breakDuration.toString())
				.onChange(async (value) => {
					const numValue = parseInt(value, 10);
					if (!isNaN(numValue)) {
						this.plugin.settings.breakDuration = numValue;
						await this.plugin.saveSettings();
						this.plugin.updateActiveChecklistView();
					}
				}));

		new Setting(containerEl)
			.setName('Folder Path')
			.setDesc('Select the folder to search for checklists.')
			.addDropdown(dropdown => {
				const folderOptions = this.getFolderOptions();
				folderOptions.forEach(folder => {
					dropdown.addOption(folder, folder);
				});
				dropdown.setValue(this.plugin.settings.folderPath);
				dropdown.onChange(async (value) => {
					this.plugin.settings.folderPath = value;
					await this.plugin.saveSettings();
					this.plugin.updateActiveChecklistView();
				});
			});
	}
}
