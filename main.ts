import {Plugin} from "obsidian";
import CreationModal from "./CreationModal";
import {MatrixSettingTab} from "./settings";

interface MatrixPluginSettings {
	rememberMatrixType: boolean; // Whether to save matrix type
	rememberMatrixDimensions: boolean; // Whether to save matrix dimensions
	inline: boolean; // Whether to put all generated text on one line
	lastUsedMatrix: string; // Previously-used type of matrix
	prevX: number | null; // Previously-used matrix X dimension
	prevY: number | null; // Previously-used matrix Y dimension
}

const DEFAULT_SETTINGS: Partial<MatrixPluginSettings> = {
	rememberMatrixType: true,
	rememberMatrixDimensions: true,
	inline: false,
	lastUsedMatrix: "",
	prevX: null,
	prevY: null,
};

export default class MyPlugin extends Plugin {
	settings: MatrixPluginSettings;

	async onload() {
		this.addRibbonIcon("pane-layout", "Obsidian Matrix", () => {
			new CreationModal(this.app, this).open();
		});

		this.addCommand({
			id: "obsidian-matrix-shortcut",
			name: "Open Obsidian Matrix menu",
			hotkeys: [],
			callback: () => {
				new CreationModal(this.app, this).open();
			},
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
