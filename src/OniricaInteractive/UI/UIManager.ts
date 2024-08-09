import { Engine } from "../../engine/Engine";
import { CameraManager } from "../CameraManager";
import { DreamManager } from "../DreamManager";
import { Sheet } from "./Sheet";
import gsap from 'gsap'
import { TextUI } from "./Text";
import { SceneManager } from "../SceneManager";

export class UIManager {
	private engine: Engine;
	private dreamManager: DreamManager;
	private sheet: Sheet
	private textUI: TextUI
	private cameraManager: CameraManager;
	public queryString: string = '';

	constructor(engine: Engine, dreamManager: DreamManager, cameraManager: CameraManager, sceneManager: SceneManager) {
		this.engine = engine;
		this.textUI = new TextUI()
		this.dreamManager = dreamManager;
		this.cameraManager = cameraManager;
		this.sheet = new Sheet();
		this.queryString = '';
		this.listenForClickEvents();

	}

	init() {
		this.listenForClickEvents();
		this.listenForSearchEvents();
		this.listenForNavigateEvents();
		this.listenForHomeIconClickEvent();
		this.listenForCrossIconClickEvent();
	}

	private listenForClickEvents() {
		this.engine.raycaster.on('click', (intersections: THREE.Intersection[]) => {
			if (intersections.length > 0) {
				const instanceId = intersections[0].index ? intersections[0].index : 0;
				this.onDreamSelection(instanceId);
			}
		})

	}

	private listenForSearchEvents() {
		const field = document.getElementById('userInput') as HTMLInputElement;
		const search = document.getElementById('searchIcon') as HTMLButtonElement;

		field.addEventListener('keypress', (event: KeyboardEvent) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				search.click();
			}
		});

		search.addEventListener('click', () => {
			this.queryDreams();
			document.getElementById('keyboardContainer')?.classList.add('hidden');
			this.textUI.showButtons()
		});
	}

	private listenForNavigateEvents() {
		const buttonNext = document.getElementById('button-next') as HTMLButtonElement;
		buttonNext.addEventListener('click', () => {
			this.navigateToNextDream();
		});

		const buttonPrevious = document.getElementById('button-previous') as HTMLButtonElement;
		buttonPrevious.addEventListener('click', () => {
			this.navigateToPreviousDream();
		});
	}

	private listenForHomeIconClickEvent() {
		const homeIcon = document.getElementById('homeIcon') as HTMLButtonElement;
		homeIcon.addEventListener('click', () => {
			this.engine.camera.reset();
		});
	}

	private listenForCrossIconClickEvent() {
		const crossIcon = document.getElementById('crossIcon') as HTMLButtonElement;
		crossIcon.addEventListener('click', () => {
			const inputElement = document.getElementById('userInput') as HTMLInputElement;
			if (inputElement) inputElement.value = '';
			this.resetQuery();
			document.getElementById('keyboardContainer')?.classList.add('hidden');
			this.textUI.hideButtons()
		});
	}

	queryDreams() {
		const field = document.getElementById('userInput') as HTMLInputElement;

		if (field.value == "" || field.value == " ") {
			this.resetQuery()
			return
		}

		this.dreamManager.searchDreams(field.value).then((ids: number[]) => {
			if (ids.length == 0) this.textUI.updateDreamCounter("-1")
			else {
				this.cameraManager.setQueriedIds(ids)
				this.onDreamSelection(ids[0])
				this.textUI.updateDreamCounter(ids.length.toString())
			}

		})

	}


	private navigateToNextDream() {
		const queriedIds = this.cameraManager._queriedIds;
		if (queriedIds.length > 0) {
			const currentIndex = queriedIds.indexOf(this.cameraManager.getSelectedId());
			const nextIndex = (currentIndex + 1) % queriedIds.length;
			const nextDreamId = queriedIds[nextIndex];
			this.onDreamSelection(nextDreamId);
		}
	}

	private navigateToPreviousDream() {
		const queriedIds = this.cameraManager._queriedIds;
		if (queriedIds.length > 0) {
			const currentIndex = queriedIds.indexOf(this.cameraManager.getSelectedId());
			const previousIndex = (currentIndex - 1 + queriedIds.length) % queriedIds.length;
			const previousDreamId = queriedIds[previousIndex];
			this.onDreamSelection(previousDreamId)
		}
	}

	public resetQuery() {
		this.queryString = '';
		this.cameraManager.setQueriedIds([]);
	}

	private onDreamSelection(dreamId: number) {
		const dream = this.dreamManager.getDream(dreamId)
		if (dream){
			this.cameraManager.onDreamSelection(dreamId);
			this.sheet.updateText(dream.dreamReport, dreamId);
			gsap.to(this.sheet.container.style, {
				opacity: 1,
				ease: "expo.in",
				duration: 3,
			// 	onUpdate: () => {
			// 		this.sheet.cssObject.lookAt(this.engine.camera.instance.position)           
			// }		
			})
		}

	}


	update() {
		this.cameraManager.update(this.queryString);
		this.sheet.update()
	}
}

