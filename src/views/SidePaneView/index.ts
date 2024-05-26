import { TFile, ItemView, WorkspaceLeaf, Notice } from 'obsidian';

import type ChecklistPlugin from '../../main';
import SidePaneComponent from './SidePane.svelte';
import store, { files } from '../../store';
import { type Task, type File, constructTaskFromLine, substractTomatoCountFromTask, formatTaskToLine } from '@/models';

export const SIDEPANE_VIEW_TYPE = 'sidepane-view';

export class SidePaneView extends ItemView {
	private sidepaneContainer: HTMLElement;
	private sidepaneComponent: SidePaneComponent | undefined;
	private plugin: ChecklistPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: ChecklistPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.contentEl.addClass('checklist-view');
		this.sidepaneContainer = this.contentEl.createDiv();
		this.updateChecklist = this.updateChecklist.bind(this);
	}

	getViewType() {
		return SIDEPANE_VIEW_TYPE;
	}

	getDisplayText() {
		return "Pomotasks";
	}

	getIcon(): string {
		return 'book-check';
	}

	async onOpen() {
		store.plugin.set(this.plugin);

		if (!this.plugin.settings) throw new Error('Settings not loaded');
		this.sidepaneComponent = new SidePaneComponent({
			target: this.sidepaneContainer, // TODO: Replace by this.contentEl
			props: {
				workMinutes: this.plugin.settings.workDuration,
				breakMinutes: this.plugin.settings.breakDuration,
				parentObsidianComponent: this,
			}
		});
		this.sidepaneComponent.$on('timer-run-out', ({ detail: { sessionMode } }) => {
			const message = sessionMode === 'work' ? 'Work session ended' : 'Break session ended';
				if (window.Notification && Notification.permission === 'granted') {
					new Notification(message);
				} else {
					new Notice(message);
				}
		});
		this.sidepaneComponent.$on('file-open-click', ({ detail: { file: { path } } }) => {
			const leaf = this.plugin.app.workspace.getLeaf();
			const file = this.plugin.app.vault.getAbstractFileByPath(path) as TFile;
			if (file) {
				leaf.openFile(file);
			}
		});
		this.sidepaneComponent.$on('checklist-item-checkbox-click', async ({ detail }) => {
			if (detail.isFocused) {
				const newTask = await this.updateTaskAfterDuration(detail.task, detail.duration);
				this.markItemAsDone(newTask);
			} else {
				this.markItemAsDone(detail.task);
			}
		});
		this.sidepaneComponent.$on('focus-end', ({ detail: { task, duration } }) => {
			this.updateTaskAfterDuration(task, duration);
		});

		this.updateChecklist();
	}

	async onClose() {
		this.sidepaneComponent?.$destroy();
	}

	async updateChecklist() {
		const markdownFiles = this.plugin.app.vault.getMarkdownFiles();
		if (!this.plugin.settings) throw new Error('Settings not loaded');
		const { tomatoEmoji, halfTomatoEmoji, quarterTomatoEmoji, folderPath } = this.plugin.settings;
		const tmpFiles: File[] = [];
		const emojiSetting = { fullTomato: tomatoEmoji, halfTomato: halfTomatoEmoji, quarterTomato: quarterTomatoEmoji };

		for (const mdFile of markdownFiles) {
			if (folderPath && !mdFile.path.startsWith(folderPath)) {
				continue;
			}

			try {
				const content = await this.plugin.app.vault.read(mdFile);
				const lines = content.split('\n');
				let tasks: Task[] = [];
				let tomatoCount = 0;

				for (const line of lines) {
					if (line.match(/^\s*-\s*\[\s\]/)) {
						const task = constructTaskFromLine(emojiSetting, line, mdFile.path);
						tasks.push(task);
						tomatoCount += task.remainingTomatoCount;
					}
				}

				if (tasks.length > 0) {
					tmpFiles.push({ name: mdFile.name.replace(/\.[^/.]+$/, ""), path: mdFile.path, tasks, tomatoCount });
				}
			} catch (error) {
				console.error(`Error reading file ${mdFile.path}:`, error);
			}
		}

		files.set(tmpFiles.sort((a, b) => a.name.localeCompare(b.name)));
	}

	async markItemAsDone(task: Task) {
		try {
			const file = this.plugin.app.vault.getAbstractFileByPath(task.filePath) as TFile;

			if (file) {
				const content = await this.plugin.app.vault.read(file);
				const updatedContent = content.replace(task.rawLine, task.rawLine.replace('[ ]', '[x]'));
				await this.plugin.app.vault.modify(file, updatedContent);
				this.updateChecklist();
			}
		} catch (error) {
			console.error(`Error updating file ${task.filePath}:`, error);
		}
	}

	private async updateTaskAfterDuration(task: Task, duration: number): Promise<Task> {
		if (!this.plugin.settings) throw new Error('Settings not loaded');
		if (!this.plugin.settings.recordCompletedTomatoes) return task;
		
		const file = this.app.vault.getAbstractFileByPath(task.filePath) as TFile;
		if (file) {
			const content = await this.app.vault.read(file);
			const setting = {
				fullTomato: this.plugin.settings.tomatoEmoji,
				halfTomato: this.plugin.settings.halfTomatoEmoji,
				quarterTomato: this.plugin.settings.quarterTomatoEmoji,
			};
			const newTask = substractTomatoCountFromTask(task, duration / this.plugin.settings.workDuration / 60000);
			const newLine = formatTaskToLine(setting, newTask);

			const updatedContent = content.replace(newTask.rawLine, newLine);
			await this.app.vault.modify(file, updatedContent);

			return { ...newTask, rawLine: newLine };
		}
		return task;
	}
}
