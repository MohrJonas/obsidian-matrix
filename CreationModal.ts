import {App, MarkdownView, Modal, Setting} from "obsidian";
import ErrorModal from "./ErrorModal";
import MyPlugin from "./main";

export default class CreationModal extends Modal {

	private static readonly matrixTypes: Record<string, string> = {
		"Plain (matrix)": "matrix",
		"Parentheses (pmatrix)": "pmatrix",
		"Square brackets (bmatrix)": "bmatrix",
		"Curly braces (Bmatrix)": "BMatrix",
		"Pipes (vmatrix)": "vmatrix",
		"Double Pipes (Vmatrix)": "Vmatrix"
	};
	private matrixWidth = 2;
	private matrixHeight = 2;
	private selectedMatrix = "Plain (matrix)";
	private parentDiv: HTMLDivElement;
	private settingsDiv: HTMLDivElement;
	private matrixDiv: HTMLDivElement;

	private parentPlugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app);
		this.parentPlugin = plugin;
	}

	onOpen() {
		this.createHTML();
		new Setting(this.settingsDiv).setName("Matrix type").addDropdown((dc) => {
			Object.keys(CreationModal.matrixTypes).forEach((key) => {
				dc.addOption(key, key);
			});
			dc.onChange((value) => {
				this.selectedMatrix = value;
			});
			if (this.parentPlugin.settings.rememberMatrixType && this.parentPlugin.settings.lastUsedMatrix) {
				dc.setValue(this.parentPlugin.settings.lastUsedMatrix);
				this.selectedMatrix = this.parentPlugin.settings.lastUsedMatrix;
			}
		});
		new Setting(this.settingsDiv).setName("Matrix width").addSlider((slider) => {
			if (this.parentPlugin.settings.rememberMatrixDimensions) {
				slider.setValue(this.parentPlugin.settings.prevX == null ? 2 : this.parentPlugin.settings.prevX);
				this.matrixWidth = this.parentPlugin.settings.prevX == null ? 2 : this.parentPlugin.settings.prevX;
			} else {
				slider.setValue(2);
			}
			slider.setLimits(1, 10, 1);
			slider.showTooltip();
			slider.setDynamicTooltip();
			slider.onChange((value) => {
				this.matrixWidth = value;
				this.regenerateMatrix();
			});
		});
		new Setting(this.settingsDiv).setName("Matrix height").addSlider((slider) => {
			if (this.parentPlugin.settings.rememberMatrixDimensions) {
				slider.setValue(this.parentPlugin.settings.prevY == null ? 2 : this.parentPlugin.settings.prevY);
				this.matrixHeight = this.parentPlugin.settings.prevY == null ? 2 : this.parentPlugin.settings.prevY;
			} else {
				slider.setValue(2);
			}
			slider.setLimits(1, 10, 1);
			slider.showTooltip();
			slider.setDynamicTooltip();
			slider.onChange((value) => {
				this.matrixHeight = value;
				this.regenerateMatrix();
			});
		});
		new Setting(this.settingsDiv).setName("Create").addButton((button) => {
			button.setIcon("checkmark");
			button.setCta();
			button.onClick(() => {
				if (this.parentPlugin.settings.rememberMatrixType) {
					this.parentPlugin.settings.lastUsedMatrix = this.selectedMatrix;
					this.parentPlugin.saveSettings();
				}
				if (this.parentPlugin.settings.rememberMatrixDimensions) {
					this.parentPlugin.settings.prevX = this.matrixWidth;
					this.parentPlugin.settings.prevY = this.matrixHeight;
					this.parentPlugin.saveSettings();
				}

				const chunks: Array<Array<string>> = Array.from(this.matrixDiv.children).map((child) => {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					return child.value;
				}).reduce((resultArray, item, index) => {
					const chunkIndex = Math.floor(index / this.matrixWidth);
					if (!resultArray[chunkIndex]) {
						resultArray[chunkIndex] = [];
					}
					resultArray[chunkIndex].push(item);
					return resultArray;
				}, []);
				const latexString = chunks.map((chunk) => {
					return chunk.join(" & ");
				}).join(this.parentPlugin.settings.inline ? " \\\\" : " \\\\\n");
				if (this.parentPlugin.settings.inline) {
					this.writeAtCursor(`\\begin{${CreationModal.matrixTypes[this.selectedMatrix]}}${latexString}\\end{${CreationModal.matrixTypes[this.selectedMatrix]}}`);
				} else {
					this.writeAtCursor(`\\begin{${CreationModal.matrixTypes[this.selectedMatrix]}}\n${latexString}\n\\end{${CreationModal.matrixTypes[this.selectedMatrix]}}`);
				}
				this.close();
			});
		});
		this.createInputs();
		this.applyCorrectStyle();
	}

	onClose() {
		this.contentEl.empty();
	}

	private createHTML() {
		this.parentDiv = this.contentEl.createEl("div", {cls: "parentDiv"});
		this.settingsDiv = this.parentDiv.createEl("div", {cls: "settingsDiv"});
		this.matrixDiv = this.parentDiv.createEl("div", {cls: "matrixDiv"});

	}

	private applyCorrectStyle() {
		this.matrixDiv.style.gridTemplateColumns = `repeat(${this.matrixWidth}, 1fr)`;
		this.matrixDiv.style.gridTemplateRows = `repeat(${this.matrixHeight}, 1fr)`;
	}

	private createInputs() {
		for (let i = 0; i < this.matrixWidth * this.matrixHeight; i++) {
			this.matrixDiv.createEl("input", {type: "text", cls: "matrixInput"});
		}
	}

	private regenerateMatrix() {
		this.matrixDiv.empty();
		this.createInputs();
		this.applyCorrectStyle();
	}

	private writeAtCursor(toWrite: string) {
		const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (mdView) {
			mdView.editor.replaceRange(toWrite, mdView.editor.getCursor());
		} else {
			this.close();
			new ErrorModal(this.app, new Error("No markdown view open")).open();
		}
	}
}
