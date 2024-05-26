import { App, Plugin, PluginSettingTab, Setting, TFolder } from 'obsidian';
import './reset.css';

import { SIDEPANE_VIEW_TYPE, SidePaneView } from './views/SidePaneView';

interface ChecklistPluginSettings {
	autoUpdate: boolean;
	tomatoEmoji: string;
	halfTomatoEmoji: string;
	quarterTomatoEmoji: string;
	workDuration: number; // in minutes
	breakDuration: number; // in minutes
	folderPath: string; // folder to search for checklists
	recordCompletedTomatoes: boolean;
}

const DEFAULT_SETTINGS: ChecklistPluginSettings = {
	autoUpdate: true,
	tomatoEmoji: '🍅',
	halfTomatoEmoji: '🍓',
	quarterTomatoEmoji: '🍒',
	workDuration: 25,
	breakDuration: 5,
	folderPath: '',
	recordCompletedTomatoes: false,
};

export default class ChecklistPlugin extends Plugin {
	settings: ChecklistPluginSettings | null = null;
	statusBarItem: HTMLElement | null = null;

	async onload() {
		await this.loadSettings();

		this.registerView(
			SIDEPANE_VIEW_TYPE,
			(leaf) => new SidePaneView(leaf, this)
		);

		this.addSettingTab(new ChecklistSettingTab(this.app, this));

		if (this.settings?.autoUpdate) {
			const updateHandler = this.debounce(() => this.updateActiveChecklistView(), 300);
			this.registerEvent(this.app.vault.on('modify', updateHandler));
			this.registerEvent(this.app.vault.on('create', updateHandler));
			this.registerEvent(this.app.vault.on('delete', updateHandler));
		}

		this.activateView();
		this.statusBarItem = this.addStatusBarItem();
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(SIDEPANE_VIEW_TYPE);
	}

	async activateView() {
		this.app.workspace.detachLeavesOfType(SIDEPANE_VIEW_TYPE);

		let rightLeaf = this.app.workspace.getRightLeaf(false);
		if (!rightLeaf) {
			rightLeaf = this.app.workspace.createLeafBySplit(this.app.workspace.getLeavesOfType('empty')[0], 'horizontal');
		}

		await rightLeaf.setViewState({
			type: SIDEPANE_VIEW_TYPE,
			active: true,
		});

		this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(SIDEPANE_VIEW_TYPE)[0]);
	}

	async updateActiveChecklistView() {
		const view = this.app.workspace.getLeavesOfType(SIDEPANE_VIEW_TYPE).first()?.view as SidePaneView;
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
			.setName('Auto update')
			.setDesc('Automatically update checklist when files are modified.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings?.autoUpdate ?? false)
				.onChange(async (value) => {
					if (!this.plugin.settings) throw new Error('Settings not loaded');
					this.plugin.settings.autoUpdate = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Tomato emoji')
			.setDesc('Emoji to use for representing a full Pomodoro session.')
			.addText(text => text
				.setPlaceholder('Enter emoji')
				.setValue(this.plugin.settings?.tomatoEmoji ?? '🍅')
				.onChange(async (value) => {
					if (!this.plugin.settings) throw new Error('Settings not loaded');
					this.plugin.settings.tomatoEmoji = value || '🍅';
					await this.plugin.saveSettings();
					this.plugin.updateActiveChecklistView();
				}));

		new Setting(containerEl)
			.setName('Half tomato emoji')
			.setDesc('Emoji to use for representing half a Pomodoro session.')
			.addText(text => text
				.setPlaceholder('Enter emoji')
				.setValue(this.plugin.settings?.halfTomatoEmoji ?? '🍓')
				.onChange(async (value) => {
					if (!this.plugin.settings) throw new Error('Settings not loaded');
					this.plugin.settings.halfTomatoEmoji = value || '🍓';
					await this.plugin.saveSettings();
					this.plugin.updateActiveChecklistView();
				}));

		new Setting(containerEl)
			.setName('Quarter tomato emoji')
			.setDesc('Emoji to use for representing a quarter of a Pomodoro session.')
			.addText(text => text
				.setPlaceholder('Enter emoji')
				.setValue(this.plugin.settings?.quarterTomatoEmoji ?? '🍒')
				.onChange(async (value) => {
					if (!this.plugin.settings) throw new Error('Settings not loaded');
					this.plugin.settings.quarterTomatoEmoji = value || '🍒';
					await this.plugin.saveSettings();
					this.plugin.updateActiveChecklistView();
				}));

		new Setting(containerEl)
			.setName('Work duration')
			.setDesc('Duration of a work session in minutes.')
			.addText(text => text
				.setPlaceholder('Enter minutes')
				.setValue(this.plugin.settings?.workDuration.toString() ?? '25')
				.onChange(async (value) => {
					const numValue = parseInt(value, 10);
					if (!isNaN(numValue)) {
						if (!this.plugin.settings) throw new Error('Settings not loaded');
						this.plugin.settings.workDuration = numValue;
						await this.plugin.saveSettings();
						this.plugin.updateActiveChecklistView();
					}
				}));

		new Setting(containerEl)
			.setName('Break duration')
			.setDesc('Duration of a break session in minutes.')
			.addText(text => text
				.setPlaceholder('Enter minutes')
				.setValue(this.plugin.settings?.breakDuration.toString() ?? '5')
				.onChange(async (value) => {
					const numValue = parseInt(value, 10);
					if (!isNaN(numValue)) {
						if (!this.plugin.settings) throw new Error('Settings not loaded');
						this.plugin.settings.breakDuration = numValue;
						await this.plugin.saveSettings();
						this.plugin.updateActiveChecklistView();
					}
				}));

		new Setting(containerEl)
			.setName('Folder path')
			.setDesc('Select the folder to search for checklists.')
			.addDropdown(dropdown => {
				const folderOptions = this.getFolderOptions();
				folderOptions.forEach(folder => {
					dropdown.addOption(folder, folder);
				});
				dropdown.setValue(this.plugin.settings?.folderPath ?? '');
				dropdown.onChange(async (value) => {
					if (!this.plugin.settings) throw new Error('Settings not loaded');
					this.plugin.settings.folderPath = value;
					await this.plugin.saveSettings();
					this.plugin.updateActiveChecklistView();
				});
			});
		
		new Setting(containerEl)
			.setName('Record elapsed time (Experimental)')
			.setDesc('Automatically track and log the time spent on the selected task using emojis. Time is recorded in units of the chosen emojis, and any time less than a full unit will be truncated.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings?.recordCompletedTomatoes ?? false)
				.onChange(async (value) => {
					if (!this.plugin.settings) throw new Error('Settings not loaded');
					this.plugin.settings.recordCompletedTomatoes = value;
					await this.plugin.saveSettings();
					this.plugin.updateActiveChecklistView();
				}));
	}
}
