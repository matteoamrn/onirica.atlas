import { Engine } from "../../engine/Engine";
import { CameraManager } from "../CameraManager";
import { DreamManager } from "../DreamManager";
import { Sheet } from "./Sheet";

export class UIManager {
  private engine: Engine;
  private dreamManager: DreamManager;
  private sheet:Sheet
  private cameraManager: CameraManager;
  public queryString: string = '';

  constructor(engine: Engine, dreamManager: DreamManager, cameraManager: CameraManager) {
    this.engine = engine;
    this.dreamManager = dreamManager;
    this.cameraManager = cameraManager;
    this.sheet = new Sheet(engine);
    this.queryString = '';
    this.listenForClickEvents();

  }

  init() {
    this.listenForClickEvents();
    // this.listenForSearchEvents();
    // this.listenForNavigateEvents();
    // this.listenForHomeIconClickEvent();
    // this.listenForCrossIconClickEvent();
  }

  private listenForClickEvents() {
    this.engine.raycaster.on('click', (intersections: THREE.Intersection[]) => {
      if (intersections.length > 0) {
          const instanceId = intersections[0].index ? intersections[0].index : 0;
          this.cameraManager.onDreamSelection(instanceId);
          this.sheet.updatePosition(intersections[0].point.x, intersections[0].point.y, intersections[0].point.z);
          this.sheet.cssObject.lookAt(this.engine.camera.instance.position)

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
    });
  }

  private queryDreams() {
    const field = document.getElementById('userInput') as HTMLInputElement;
    this.queryString = field.value.trim();
    const queriedIds = this.dreamManager.searchDreams(this.queryString);
    this.cameraManager.setQueriedIds(queriedIds);

    if (queriedIds.length > 0) {
      const firstQueriedDreamId = queriedIds[0];
      this.cameraManager.onDreamSelection(firstQueriedDreamId);
    }
  }

  private navigateToNextDream() {
    const queriedIds = this.cameraManager._queriedIds;
    if (queriedIds.length > 0) {
      const currentIndex = queriedIds.indexOf(this.cameraManager.getSelectedId());
      const nextIndex = (currentIndex + 1) % queriedIds.length;
      const nextDreamId = queriedIds[nextIndex];
      this.cameraManager.onDreamSelection(nextDreamId);
    }
  }

  private navigateToPreviousDream() {
    const queriedIds = this.cameraManager._queriedIds;
    if (queriedIds.length > 0) {
      const currentIndex = queriedIds.indexOf(this.cameraManager.getSelectedId());
      const previousIndex = (currentIndex - 1 + queriedIds.length) % queriedIds.length;
      const previousDreamId = queriedIds[previousIndex];
      this.cameraManager.onDreamSelection(previousDreamId);
    }
  }

  public resetQuery() {
    this.queryString = '';
    this.cameraManager.setQueriedIds([]);
  }

  update() {
    this.cameraManager.update(this.queryString);
    this.sheet.update();
  }
}

