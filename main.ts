import {Plugin} from 'obsidian';
import CreationModal from "./CreationModal";
import {MatrixSettingTab} from "./settings";

interface MatrixPluginSettings {
	rememberMatrixType: boolean;
	inline: boolean;
	lastUsedMatrix: string;
}

const DEFAULT_SETTINGS: Partial<MatrixPluginSettings> = {
	rememberMatrixType: true,
	inline: false,
	lastUsedMatrix: "",
  };

export default class MyPlugin extends Plugin {
	settings: MatrixPluginSettings;

	async onload() {
		this.addRibbonIcon("pane-layout", "Obsidian Matrix", () => {
			new CreationModal(this.app, this).open()
		});

		await this.loadSettings();

		this.addSettingTab(new MatrixSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
