import { TFile, ItemView, WorkspaceLeaf, Notice } from 'obsidian';

import type ChecklistPlugin from '../../main';
import { updateTaskBodyAfterElapsedMinutes, getRemainingMinutesFromTaskBody } from '../../lib/tomatoCalculation';
import SidePaneComponent from './SidePane.svelte';
import store, { files } from '../../store';
import type { File, Task } from '../../types';

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
		this.sidepaneComponent.$on('checklist-item-checkbox-click', ({ detail: { task } }) => {
			this.markItemAsDone(task);
		});
		this.sidepaneComponent.$on('focus-end', async ({ detail: { task, duration } }) => {
			if (!this.plugin.settings) throw new Error('Settings not loaded');
			const file = this.app.vault.getAbstractFileByPath(task.filePath) as TFile;
			if (file) {
				const content = await this.app.vault.read(file);
				const setting = {
					fullTomatoEmoji: this.plugin.settings.tomatoEmoji,
					halfTomatoEmoji: this.plugin.settings.halfTomatoEmoji,
					quarterTomatoEmoji: this.plugin.settings.quarterTomatoEmoji,
					workMinutesPerTomato: this.plugin.settings.workDuration
				};
				const newTaskBody = updateTaskBodyAfterElapsedMinutes(setting, task.body, duration / 60000);
				if (newTaskBody === task.body) return;
				
				const startIndex = task.line.indexOf('- [ ] ');
				const endIndex = startIndex + '- [ ] '.length;
				const taskBody = task.line.substring(endIndex);

				const updatedContent = content.replace(taskBody, newTaskBody);
				await this.app.vault.modify(file, updatedContent);
			}
		});

		this.updateChecklist();
	}

	async onClose() {
		this.sidepaneComponent?.$destroy();
	}

	async updateChecklist() {
		const markdownFiles = this.plugin.app.vault.getMarkdownFiles();
		if (!this.plugin.settings) throw new Error('Settings not loaded');
		const { tomatoEmoji, halfTomatoEmoji, quarterTomatoEmoji, workDuration, breakDuration, folderPath } = this.plugin.settings;
		const tmpFiles: File[] = [];

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
						const taskBody = line.trim().slice(6);
						const filePath = mdFile.path;
						const task = { body: taskBody, filePath, line };
						tasks.push(task);
						const setting = {
							fullTomatoEmoji: tomatoEmoji,
							halfTomatoEmoji: halfTomatoEmoji,
							quarterTomatoEmoji: quarterTomatoEmoji,
							workMinutesPerTomato: workDuration
						};
						tomatoCount += getRemainingMinutesFromTaskBody(setting, line) / workDuration;
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
				const updatedContent = content.replace(task.line, task.line.replace('[ ]', '[x]'));
				await this.plugin.app.vault.modify(file, updatedContent);
				this.updateChecklist();
			}
		} catch (error) {
			console.error(`Error updating file ${task.filePath}:`, error);
		}
	}
}
