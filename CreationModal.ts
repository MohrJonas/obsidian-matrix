import {App, MarkdownView, Modal, Notice, Setting, SliderComponent} from "obsidian";
import MyPlugin from "./main";

export default class CreationModal extends Modal {

	private static readonly matrixTypes: Record<string, string> = {
		"Plain (matrix)": "matrix",
		"Parentheses (pmatrix)": "pmatrix",
		"Square brackets (bmatrix)": "bmatrix",
		"Curly braces (Bmatrix)": "Bmatrix",
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

	private heightSlider: Setting;
	private widthSlider: Setting;

	private readonly MAX_WIDTH = 10; // Max width of a matrix in GUI. (min is 1)
	private readonly MAX_HEIGHT = 10; // Max height of same.

	constructor(app: App, plugin: MyPlugin) {
		super(app);
		this.parentPlugin = plugin;
	}

	onOpen() {
		if (!this.app.workspace.getActiveViewOfType(MarkdownView)) {
			new Notice("No markdown view open");
			this.close();
		}
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
		this.widthSlider = new Setting(this.settingsDiv).setName("Matrix width").addSlider((slider) => {
			if (this.parentPlugin.settings.rememberMatrixDimensions) {
				slider.setValue(this.parentPlugin.settings.prevX == null ? 2 : this.parentPlugin.settings.prevX);
				this.matrixWidth = this.parentPlugin.settings.prevX == null ? 2 : this.parentPlugin.settings.prevX;
			} else {
				slider.setValue(2);
			}
			slider.setLimits(1, this.MAX_WIDTH, 1);
			slider.showTooltip();
			slider.setDynamicTooltip();
			slider.onChange((value) => {
				this.matrixWidth = value;
				this.regenerateMatrix();
			});
		});
		this.heightSlider = new Setting(this.settingsDiv).setName("Matrix height").addSlider((slider) => {
			if (this.parentPlugin.settings.rememberMatrixDimensions) {
				slider.setValue(this.parentPlugin.settings.prevY == null ? 2 : this.parentPlugin.settings.prevY);
				this.matrixHeight = this.parentPlugin.settings.prevY == null ? 2 : this.parentPlugin.settings.prevY;
			} else {
				slider.setValue(2);
			}
			slider.setLimits(1, this.MAX_HEIGHT, 1);
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
				this.constructOutput();
			});
		});

		this.parentDiv.addEventListener("keyup", this.keyEventHandler);

		this.createInputs();
		this.applyCorrectStyle();
	}

	onClose() {
		this.contentEl.empty();
	}

	private keyEventHandler = (evt: KeyboardEvent) => {
		const widthSliderComponent = this.widthSlider.components[0] as SliderComponent;
		const heightSliderComponent = this.heightSlider.components[0] as SliderComponent;

		if (evt.key == "Enter") {
			this.constructOutput();
		} else if (evt.key == "ArrowRight" && evt.altKey && this.matrixWidth < this.MAX_WIDTH) {
			this.matrixWidth += 1;
			widthSliderComponent.setValue(this.matrixWidth);
			this.regenerateMatrix();
			const firstTextBox = this.matrixDiv.children[0] as HTMLElement;
			firstTextBox.focus(); // If focus is not kept on some element, then for some reason, the keybind ceases to work until the user manually focuses on a text box within matrixDiv again
		} else if (evt.key == "ArrowLeft" && evt.altKey && this.matrixWidth > 1) {
			this.matrixWidth -= 1;
			widthSliderComponent.setValue(this.matrixWidth);
			this.regenerateMatrix();
			const firstTextBox = this.matrixDiv.children[0] as HTMLElement;
			firstTextBox.focus();
		} else if (evt.key == "ArrowUp" && evt.altKey && this.matrixHeight > 1) {
			this.matrixHeight -= 1;
			heightSliderComponent.setValue(this.matrixHeight);
			this.regenerateMatrix();
			const firstTextBox = this.matrixDiv.children[0] as HTMLElement;
			firstTextBox.focus();
		} else if (evt.key == "ArrowDown" && evt.altKey && this.matrixHeight < this.MAX_HEIGHT) {
			this.matrixHeight += 1;
			heightSliderComponent.setValue(this.matrixHeight);
			this.regenerateMatrix();
			const firstTextBox = this.matrixDiv.children[0] as HTMLElement;
			firstTextBox.focus();
		}
	};

	private constructOutput() {
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
			return (child as HTMLInputElement).value;
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
		const matrixContent = Array.from(this.matrixDiv.children).map((child) => { return (child as HTMLInputElement).value; });
		this.matrixDiv.empty();
		this.createInputs();
		matrixContent.slice(0, this.matrixDiv.children.length).forEach((content, index) => {
			(this.matrixDiv.children[index] as HTMLInputElement).value = content;
		});
		this.applyCorrectStyle();
	}

	private writeAtCursor(toWrite: string) {
		const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
		mdView.editor.replaceRange(toWrite, mdView.editor.getCursor());
		this.close();
	}
}
