import {App, Modal} from "obsidian";

export default class ErrorModal extends Modal {

	private readonly error: Error;

	constructor(app: App, error: Error) {
		super(app);
		this.error = error;
	}

	onOpen() {
		this.contentEl.createEl("h1", { text: this.error.message });
	}

	onClose() {
		this.contentEl.empty();
	}

}
