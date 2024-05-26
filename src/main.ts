import { App, Plugin, PluginSettingTab, Setting, TFolder } from 'obsidian';
import './reset.css';

import { SIDEPANE_VIEW_TYPE, SidePaneView } from './views/SidePaneView';
import { symbolSetting, sessionSetting } from './store';
import type { SymbolSetting, SessionSetting, FeatureToggleSetting, FileFilterSetting } from './types';

interface ChecklistPluginSettings {
	symbolSetting: SymbolSetting;
	sessionSetting: SessionSetting;
	fileFilterSetting: FileFilterSetting;
	featureToggleSetting: FeatureToggleSetting;
}

const DEFAULT_SETTINGS: ChecklistPluginSettings = {
	symbolSetting: {
		fullTomato: '🍅',
		halfTomato: '🍓',
		quarterTomato: '🍒',
	},
	sessionSetting: {
		workMinutes: 25,
		breakMinutes: 5,
	},
	fileFilterSetting: {
		folderPath: '',
	},
	featureToggleSetting: {
		elapsedTimeRecording: false,
	},
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
		
		this.registerEvent(this.app.vault.on('modify', (file) => this.findSidePaneView()?.handleFileModified(file)));
		this.registerEvent(this.app.vault.on('delete', (file) => this.findSidePaneView()?.handleFileDeleted(file)));
		this.registerEvent(this.app.vault.on('rename', (file, oldPath) => this.findSidePaneView()?.handleFileRenamed(file, oldPath)));

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

	async reloadAllFiles() {
		this.findSidePaneView()?.loadAllFiles();
	}

	async loadSettings() {
		const data = await this.loadData();
		const settings: ChecklistPluginSettings = { ...DEFAULT_SETTINGS, ...data };
		this.settings = settings;
		sessionSetting.set(this.settings.sessionSetting);
		symbolSetting.set(this.settings.symbolSetting);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	updateSymbolSetting(input: Partial<SymbolSetting>) {
		if (!this.settings) throw new Error('Settings not loaded');
		const newSetting = { ...this.settings.symbolSetting, ...input };
		this.settings.symbolSetting = newSetting;
		symbolSetting.set(newSetting);
	}

	updateSessionSetting(input: Partial<SessionSetting>) {
		if (!this.settings) throw new Error('Settings not loaded');
		const newSetting = { ...this.settings.sessionSetting, ...input };
		this.settings.sessionSetting = newSetting;
		sessionSetting.set(newSetting);
	}

	updateFileFilterSetting(input: Partial<FileFilterSetting>) {
		if (!this.settings) throw new Error('Settings not loaded');
		const newSetting = { ...this.settings.fileFilterSetting, ...input };
		this.settings.fileFilterSetting = newSetting;
	}

	updateFeatureToggleSetting(input: Partial<FeatureToggleSetting>) {
		if (!this.settings) throw new Error('Settings not loaded');
		const newSetting = { ...this.settings.featureToggleSetting, ...input };
		this.settings.featureToggleSetting = newSetting;
	}

	private findSidePaneView(): SidePaneView | undefined {
		return this.app.workspace.getLeavesOfType(SIDEPANE_VIEW_TYPE).first()?.view as SidePaneView;
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
			.setName('Tomato emoji')
			.setDesc('Emoji to use for representing a full Pomodoro session.')
			.addText(text => text
				.setPlaceholder('Enter emoji')
				.setValue(this.plugin.settings?.symbolSetting.fullTomato ?? DEFAULT_SETTINGS.symbolSetting.fullTomato)
				.onChange(async (value) => {
					this.plugin.updateSymbolSetting({ fullTomato: value || DEFAULT_SETTINGS.symbolSetting.fullTomato });
					await this.plugin.saveSettings();
					this.plugin.reloadAllFiles();
				}));

		new Setting(containerEl)
			.setName('Half tomato emoji')
			.setDesc('Emoji to use for representing half a Pomodoro session.')
			.addText(text => text
				.setPlaceholder('Enter emoji')
				.setValue(this.plugin.settings?.symbolSetting.halfTomato ?? DEFAULT_SETTINGS.symbolSetting.halfTomato)
				.onChange(async (value) => {
					this.plugin.updateSymbolSetting({ halfTomato: value || DEFAULT_SETTINGS.symbolSetting.halfTomato });
					await this.plugin.saveSettings();
					this.plugin.reloadAllFiles();
				}));

		new Setting(containerEl)
			.setName('Quarter tomato emoji')
			.setDesc('Emoji to use for representing a quarter of a Pomodoro session.')
			.addText(text => text
				.setPlaceholder('Enter emoji')
				.setValue(this.plugin.settings?.symbolSetting.quarterTomato ?? DEFAULT_SETTINGS.symbolSetting.quarterTomato)
				.onChange(async (value) => {
					this.plugin.updateSymbolSetting({ quarterTomato: value || DEFAULT_SETTINGS.symbolSetting.quarterTomato });
					await this.plugin.saveSettings();
					this.plugin.reloadAllFiles();
				}));

		new Setting(containerEl)
			.setName('Work duration')
			.setDesc('Duration of a work session in minutes.')
			.addText(text => text
				.setPlaceholder('Enter minutes')
				.setValue(this.plugin.settings?.sessionSetting.workMinutes.toString() ?? '25')
				.onChange(async (value) => {
					const numValue = parseInt(value, 10);
					if (!isNaN(numValue)) {
						this.plugin.updateSessionSetting({ workMinutes: numValue });
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('Break duration')
			.setDesc('Duration of a break session in minutes.')
			.addText(text => text
				.setPlaceholder('Enter minutes')
				.setValue(this.plugin.settings?.sessionSetting.breakMinutes.toString() ?? '5')
				.onChange(async (value) => {
					const numValue = parseInt(value, 10);
					if (!isNaN(numValue)) {
						this.plugin.updateSessionSetting({ breakMinutes: numValue });
						await this.plugin.saveSettings();
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
				dropdown.setValue(this.plugin.settings?.fileFilterSetting.folderPath ?? '');
				dropdown.onChange(async (value) => {
					this.plugin.updateFileFilterSetting({ folderPath: value });
					await this.plugin.saveSettings();
					this.plugin.reloadAllFiles();
				});
			});
		
		new Setting(containerEl)
			.setName('Record elapsed time (Experimental)')
			.setDesc('Automatically track and log the time spent on the selected task using emojis. Time is recorded in units of the chosen emojis, and any time less than a full unit will be truncated.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings?.featureToggleSetting.elapsedTimeRecording ?? false)
				.onChange(async (value) => {
					this.plugin.updateFeatureToggleSetting({ elapsedTimeRecording: value });
					await this.plugin.saveSettings();
				}));
	}
}
