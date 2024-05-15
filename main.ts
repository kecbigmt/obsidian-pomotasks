import { App, Plugin, PluginSettingTab, Setting, TFile, ItemView, WorkspaceLeaf, MarkdownRenderer, Component } from 'obsidian';

interface ChecklistPluginSettings {
	autoUpdate: boolean;
}

const DEFAULT_SETTINGS: ChecklistPluginSettings = {
	autoUpdate: true
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
			this.registerEvent(
				this.app.vault.on('modify', () => {
					this.updateActiveChecklistView();
				})
			);
			this.registerEvent(
				this.app.vault.on('create', () => {
					this.updateActiveChecklistView();
				})
			);
			this.registerEvent(
				this.app.vault.on('delete', () => {
					this.updateActiveChecklistView();
				})
			);
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

		for (const file of files) {
			const content = await this.plugin.app.vault.read(file);
			const lines = content.split('\n');

			for (const line of lines) {
				if (line.match(/^\s*-\s*\[\s\]/)) {
					checklistItems.push({ task: line.trim(), path: file.path, line });
					tomatoCount += (line.match(/🍅/g) || []).length;
				}
			}
		}

		this.tomatoCountContainer.setText(`Total Tomatoes: ${tomatoCount}`);
		this.checklistContainer.empty();

		const checklistContent = this.checklistContainer.createDiv({ cls: 'checklist-list' });
		
		checklistItems.forEach(async (item) => {
			const itemEl = checklistContent.createEl('label', { cls: 'checklist-item' });

			const checkbox = itemEl.createEl('input');
			checkbox.type = 'checkbox';
			checkbox.onclick = async () => {
				await this.markItemAsDone(item);
			};

			const markdownContainer = itemEl.createDiv();
			await MarkdownRenderer.render(this.plugin.app, item.task.slice(6), markdownContainer, item.path, this);
		});
	}

	async markItemAsDone(item: { task: string, path: string, line: string }) {
		const file = this.plugin.app.vault.getAbstractFileByPath(item.path) as TFile;

		if (file) {
			const content = await this.plugin.app.vault.read(file);
			const updatedContent = content.replace(item.line, item.line.replace('[ ]', '[x]'));
			await this.plugin.app.vault.modify(file, updatedContent);
			this.updateChecklist();
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
	}
}
