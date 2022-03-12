import {App, MarkdownView, Modal, Setting} from "obsidian";
import ErrorModal from "./ErrorModal";

export default class CreationModal extends Modal {

	private matrixWidth: number = 2;
	private matrixHeight: number = 2;
	private parentDiv: HTMLDivElement;
	private settingsDiv: HTMLDivElement;
	private matrixDiv: HTMLDivElement;

	constructor(app: App) {
		super(app);
	}

	onOpen() {
		this.createHTML();
		new Setting(this.settingsDiv).setName("Matrix width").addSlider((slider) => {
			slider.setValue(2);
			slider.setLimits(1, 10, 1);
			slider.showTooltip();
			slider.setDynamicTooltip();
			slider.onChange((value) => {
				this.matrixWidth = value;
				this.regenerateMatrix();
			});
		});
		new Setting(this.settingsDiv).setName("Matrix height").addSlider((slider) => {
			slider.setValue(2);
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
				let chunks: Array<Array<string>> = Array.from(this.matrixDiv.children).map((child) => {
					//@ts-ignore
					return child.value;
				}).reduce((resultArray, item, index) => {
					const chunkIndex = Math.floor(index / this.matrixWidth);
					if (!resultArray[chunkIndex]) {
						resultArray[chunkIndex] = [];
					}
					resultArray[chunkIndex].push(item);
					return resultArray;
				}, []);
				let latexString = chunks.map((chunk) => {
					return chunk.join(" & ");
				}).join(" \\\\\n");
				this.writeAtCursor(`\\begin{pmatrix}\n${latexString}\n\\end{pmatrix}`);
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
			this.close()
			new ErrorModal(this.app, new Error("No markdown view open")).open();
		}
	}
}
