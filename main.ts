import { App, Plugin, PluginSettingTab, Setting, TFile, ItemView, WorkspaceLeaf, MarkdownRenderer, Component } from 'obsidian';

interface ChecklistPluginSettings {
	autoUpdate: boolean;
	tomatoEmoji: string;
}

const DEFAULT_SETTINGS: ChecklistPluginSettings = {
	autoUpdate: true,
	tomatoEmoji: '🍅'
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
	private tomatoCountContainer: HTMLElement;
	private plugin: ChecklistPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: ChecklistPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.tomatoCountContainer = this.contentEl.createDiv({ cls: 'tomato-count-container' });
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
		let checklistItems: { task: string, path: string, line: string }[] = [];
		let tomatoCount = 0;
		const tomatoEmoji = this.plugin.settings.tomatoEmoji;

		for (const file of files) {
			try {
				const content = await this.plugin.app.vault.read(file);
				const lines = content.split('\n');

				for (const line of lines) {
					if (line.match(/^\s*-\s*\[\s\]/)) {
						checklistItems.push({ task: line.trim(), path: file.path, line });
						tomatoCount += (line.match(new RegExp(tomatoEmoji, 'g')) || []).length;
					}
				}
			} catch (error) {
				console.error(`Error reading file ${file.path}:`, error);
			}
		}

		this.tomatoCountContainer.setText(`Total: ${tomatoEmoji}x${tomatoCount}`);
		this.checklistContainer.empty();

		const checklistContent = this.checklistContainer.createDiv({ cls: 'checklist-list' });
		
		for (const item of checklistItems) {
			await this.renderChecklistItem(item, checklistContent);
		}
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
			.setDesc('Emoji to use for representing a Pomodoro session.')
			.addText(text => text
				.setPlaceholder('Enter emoji')
				.setValue(this.plugin.settings.tomatoEmoji)
				.onChange(async (value) => {
					this.plugin.settings.tomatoEmoji = value || '🍅';
					await this.plugin.saveSettings();
					this.plugin.updateActiveChecklistView();
				}));
	}
}
