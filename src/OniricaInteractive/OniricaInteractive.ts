import { Engine } from '../engine/Engine';
import { Experience } from '../engine/Experience';
import { Resource } from '../engine/Resources';
import { CSVParser } from './CSVParser';
import { DreamManager } from './DreamManager';
import { SceneManager } from './SceneManager';
import { CameraManager } from './CameraManager';
import { Dream } from './Dream';
import { UIManager } from './UI/UIManager';
import InactivityTracker from './InactivityTracker';

export class OniricaInteractive implements Experience {
	private engine: Engine;
	private csvParser: CSVParser;
	private dreamManager: DreamManager | undefined;
	private sceneManager: SceneManager | undefined;
	private cameraManager: CameraManager | undefined;
	private uiManager: UIManager | undefined;
    private inactivityManager: InactivityTracker = InactivityTracker.getInstance()

	resources: Resource[] = [];

	constructor(engine: Engine) {
		this.engine = engine;
		this.csvParser = new CSVParser();

		this.parseCSV()
			.then((dreams) => {
				this.dreamManager = new DreamManager(dreams);
				this.sceneManager = new SceneManager(this.engine, dreams, 8);
				this.cameraManager = new CameraManager(this.engine, this.dreamManager,this.sceneManager, 0.5);
				this.uiManager = new UIManager(this.engine, this.dreamManager, this.cameraManager);

				this.sceneManager.createScene();
				this.uiManager.init();
			})
			.catch((error) => {
				console.error('Error fetching or parsing CSV:', error.message);
			});


	}


	init(): void {
		this.inactivityManager.addEventListener('inactive', () => {
			this.engine.camera.reset();
			this.uiManager!.resetQuery()
			this.engine.camera.enableAutorotate = true
		}
		);

		this.inactivityManager.addEventListener('active', () => {
			this.engine.camera.enableAutorotate = false
		});
    }

	resize?(): void {
	}


	update() {
		if (this.uiManager) {
			this.uiManager.update()
		}
	}

	private async parseCSV(): Promise<Map<number, Dream>> {
		try {
			const response = await fetch('/dreams.csv');
			const csvData = await response.text();
			return this.csvParser.parseCSV(csvData);
		} catch (error: any) {
			throw new Error(error.message);
		}
	}
}
