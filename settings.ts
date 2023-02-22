import MyPlugin from "./main";
import { App, PluginSettingTab, Setting, ToggleComponent } from "obsidian";

export class MatrixSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Remember previous matrix type")
			.setDesc("After choosing a matrix type and clicking \"Create\", the type will be selected by default the next time you open the matrix creation window.")
			.addToggle((toggle: ToggleComponent) =>
				toggle
					.setValue(this.plugin.settings.rememberMatrixType)
					.onChange(async (value: boolean) => {
						this.plugin.settings.rememberMatrixType = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Remember previous matrix dimensions")
			.setDesc("After entering a matrix and clicking \"Create\", the dimensions will be selected by default the next time you open the matrix creation window.")
			.addToggle((toggle: ToggleComponent) =>
				toggle
					.setValue(this.plugin.settings.rememberMatrixDimensions)
					.onChange(async (value: boolean) => {
						this.plugin.settings.rememberMatrixDimensions = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Put matrix command on one line")
			.setDesc("Rather than inserting a newline after each row of the matrix, all text will be placed on one line. This will allow the matrix to immediately work between inline (single) $-signs, as well as multiline $$-signs.")
			.addToggle((toggle: ToggleComponent) =>
				toggle
					.setValue(this.plugin.settings.inline)
					.onChange(async (value: boolean) => {
						this.plugin.settings.inline = value;
						await this.plugin.saveSettings();
					})
			);
	}
}