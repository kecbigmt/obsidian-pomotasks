import { TFile, ItemView, WorkspaceLeaf, Notice, TAbstractFile } from 'obsidian';

import type ChecklistPlugin from '../../main';
import SidePaneComponent from './SidePane.svelte';
import { plugin, files } from '@/store';
import { type Task, type File, substractTomatoCountFromTask, formatTaskToLine, constructFileFromContent } from '@/models';

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
		plugin.set(this.plugin);

		this.sidepaneComponent = new SidePaneComponent({
			target: this.sidepaneContainer, // TODO: Replace by this.contentEl
			props: {
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
		this.sidepaneComponent.$on('task-complete', async ({ detail }) => {
			if (detail.duration != null) {
				const newTask = await this.updateTaskAfterDuration(detail.task, detail.duration);
				this.markItemAsDone(newTask);
			} else {
				this.markItemAsDone(detail.task);
			}
		});
		this.sidepaneComponent.$on('task-stop', ({ detail: { task, duration } }) => {
			this.updateTaskAfterDuration(task, duration);
		});

		this.loadAllFiles();
	}

	async onClose() {
		this.sidepaneComponent?.$destroy();
	}

	async handleFileModified(abstractFile: TAbstractFile) {
		if (!(abstractFile instanceof TFile)) return;
		const newFile = await this.loadAndConstructFile(abstractFile);

		files.update((files) => {
			if (newFile.tasks.length === 0) {
				return files.filter((file) => file.path !== newFile.path);
			}

			const index = files.findIndex((file) => file.path === newFile.path);
			if (index === -1) {
				files.push(newFile);
				files.sort((a, b) => a.name.localeCompare(b.name));
			} else {
				files[index] = newFile;
			}
			return files;
		});
	}

	async handleFileDeleted(abstractFile: TAbstractFile) {
		if (!(abstractFile instanceof TFile)) return;
		files.update((files) => files.filter((file) => file.path !== abstractFile.path));
	}

	async handleFileRenamed(abstractFile: TAbstractFile, oldPath: string) {
		if (!(abstractFile instanceof TFile)) return;
		const newFile = await this.loadAndConstructFile(abstractFile);

		files.update((files) => {
			if (newFile.tasks.length === 0) {
				return files.filter((file) => file.path !== oldPath);
			}

			const index = files.findIndex((file) => file.path === oldPath);
			if (index === -1) {
				files.push(newFile);
				files.sort((a, b) => a.name.localeCompare(b.name));
			} else {
				files[index] = newFile;
			}
			return files;
		});
	}

	async loadAllFiles() {
		const markdownFiles = this.plugin.app.vault.getMarkdownFiles();
		const folderPath = this.pluginSetting.fileFilterSetting.folderPath;
		const tmpFiles: File[] = [];

		for (const mdFile of markdownFiles) {
			if (folderPath && !mdFile.path.startsWith(folderPath)) continue;
			const file = await this.loadAndConstructFile(mdFile);
			if (file.tasks.length > 0) tmpFiles.push(file);
		}
		files.set(tmpFiles.sort((a, b) => a.name.localeCompare(b.name)));
	}

	private async loadAndConstructFile(file: TFile) {
		try {
			const content = await this.plugin.app.vault.read(file);
			return constructFileFromContent(this.pluginSetting.symbolSetting, content, file.name, file.path);
		} catch (error) {
			throw new Error(`Error reading file ${file.path}: ${error}`);
		}
	}
	
	private async markItemAsDone(task: Task) {
		try {
			const file = this.plugin.app.vault.getAbstractFileByPath(task.filePath) as TFile;

			if (file) {
				const content = await this.plugin.app.vault.read(file);
				const updatedContent = content.replace(task.rawLine, task.rawLine.replace('[ ]', '[x]'));
				await this.plugin.app.vault.modify(file, updatedContent);
			}
		} catch (error) {
			console.error(`Error updating file ${task.filePath}:`, error);
		}
	}

	private async updateTaskAfterDuration(task: Task, duration: number): Promise<Task> {
		const { featureToggleSetting, symbolSetting, sessionSetting } = this.pluginSetting;
		if (!featureToggleSetting.elapsedTimeRecording) return task;
		
		const file = this.app.vault.getAbstractFileByPath(task.filePath) as TFile;
		if (file) {
			const content = await this.app.vault.read(file);
			const newTask = substractTomatoCountFromTask(task, duration / sessionSetting.workMinutes / 60000);
			const newLine = formatTaskToLine(symbolSetting, newTask);

			const updatedContent = content.replace(newTask.rawLine, newLine);
			await this.app.vault.modify(file, updatedContent);

			return { ...newTask, rawLine: newLine };
		}
		return task;
	}

	private get pluginSetting() {
		if (!this.plugin.settings) throw new Error('Settings not loaded');
		return this.plugin.settings;
	}
}
