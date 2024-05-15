import { App, Plugin, PluginSettingTab, Setting, TFile, ItemView, WorkspaceLeaf, MarkdownRenderer, Component, setIcon, TFolder } from 'obsidian';

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

class ChecklistView extends ItemView {
	private checklistContainer: HTMLElement;
	private plugin: ChecklistPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: ChecklistPlugin) {
		super(leaf);
		this.plugin = plugin;
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
		this.updateChecklist();
	}

	async updateChecklist() {
		const files = this.plugin.app.vault.getMarkdownFiles();
		const { tomatoEmoji, halfTomatoEmoji, quarterTomatoEmoji, workDuration, breakDuration, folderPath } = this.plugin.settings;
		let fileItems: { fileName: string, filePath: string, items: { task: string, path: string, line: string }[], tomatoCount: number }[] = [];
	
		for (const file of files) {
			if (folderPath && !file.path.startsWith(folderPath)) {
				continue;
			}
			
			try {
				const content = await this.plugin.app.vault.read(file);
				const lines = content.split('\n');
				let items: { task: string, path: string, line: string }[] = [];
				let tomatoCount = 0;
	
				for (const line of lines) {
					if (line.match(/^\s*-\s*\[\s\]/)) {
						items.push({ task: line.trim(), path: file.path, line });
						tomatoCount += (line.match(new RegExp(tomatoEmoji, 'g')) || []).length;
						tomatoCount += (line.match(new RegExp(halfTomatoEmoji, 'g')) || []).length * 0.5;
						tomatoCount += (line.match(new RegExp(quarterTomatoEmoji, 'g')) || []).length * 0.25;
					}
				}
	
				if (items.length > 0) {
					fileItems.push({ fileName: file.name.replace(/\.[^/.]+$/, ""), filePath: file.path, items, tomatoCount });
				}
			} catch (error) {
				console.error(`Error reading file ${file.path}:`, error);
			}
		}
	
		fileItems = fileItems.sort((a, b) => a.fileName.localeCompare(b.fileName));
		this.checklistContainer.empty();
	
		fileItems.forEach(fileItem => {
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
	}
		
	
	async renderChecklistItem(item: { task: string, path: string, line: string }, container: HTMLElement) {
		const itemEl = container.createEl('label', { cls: 'checklist-item' });

		const checkbox = itemEl.createEl('input');
		checkbox.type = 'checkbox';
		checkbox.onclick = async () => {
			await this.markItemAsDone(item);
		};

		const markdownContainer = itemEl.createDiv();
		await MarkdownRenderer.render(this.plugin.app, item.task.slice(6), markdownContainer, item.path, this);
	}

	async markItemAsDone(item: { task: string, path: string, line: string }) {
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