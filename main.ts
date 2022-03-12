import {Plugin} from 'obsidian';
import CreationModal from "./CreationModal";

export default class MyPlugin extends Plugin {

	async onload() {
		this.addRibbonIcon("pane-layout", "Obsidian Matrix", () => {
			new CreationModal(this.app).open()
		});
	}
}
