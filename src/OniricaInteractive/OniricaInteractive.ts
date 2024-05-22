import * as THREE from 'three';
import { Engine } from '../engine/Engine'
import { Experience } from '../engine/Experience'
import { Resource } from '../engine/Resources'
import { Dream } from './Dream';
import Papa from 'papaparse';
import { TextUI } from './UI/Text';
import { kdTree } from 'kd-tree-javascript'
import gsap from 'gsap'
import Utils from './Utils'
import InactivityTracker from './InactivityTracker';

import { TroikaText } from './TroikaText';

export class OniricaInteractive implements Experience {
    private hasCSVLoaded: boolean = false;
    private cameraForwardDistance: number = 0.5
    private nneighbors: number = 8;
    private textUI: TextUI = new TextUI();
    private dreams: Map<number, Dream>;
    private queriedDreams: Dream[] = []
    private cameraPos: THREE.Vector3 = new THREE.Vector3();
    private cameraDir: THREE.Vector3 = new THREE.Vector3();
    private dreamTexts: TroikaText[] = []; // index 0 + nneighbors

    private inactivityManager: InactivityTracker = InactivityTracker.getInstance()

    private selectedId: number = 0 // the one user clicked on
    private highlightedIds: number[] = [] // the ones close to the camera forward position
    private queriedIds: number[] = []  // the ones that contain the word from user input

    private tree: kdTree<THREE.Vector3> | undefined
    private points: THREE.Points | undefined

    public baseColor = new THREE.Color(0xe6e6e6);
    public selectColor = new THREE.Color(0xffffff)
    public neighborColor = new THREE.Color(0x6ca96d)
    public axesColor = new THREE.Color(0xe4e4e4)

    public maxTextWidth = 0.10

    resources: Resource[] = [
    ]
    queryString: string = '';
    backgroundMesh: any;

    constructor(private engine: Engine) {
        this.dreams = new Map<number, Dream>()
        this.parseCSV().finally(() => {
            this.createScene();
            this.tree = new kdTree(Array.from(this.dreams.values()).map(dream => dream.position), Utils.distance, ["x", "y", "z"]);
            this.hasCSVLoaded = true;
            this.updateNearest(this.cameraForwardDistance)
        });
    }

    init() {
        this.listenForClickEvents();
        this.listenForSearchEvents();

        document.getElementById('button-next')?.addEventListener('click', () => {
            this.navigateToNextDream();
        });
        document.getElementById('button-previous')?.addEventListener('click', () => {
            this.navigateToPreviousDream();
        });

        document.getElementById("crossIcon")?.addEventListener('click', () => {
            const inputElement = document.getElementById("userInput") as HTMLInputElement;
            if (inputElement) inputElement.value = "";
            this.textUI.resetKeyboard()
            this.resetQuery()
            document.getElementById("keyboardContainer")?.classList.add("hidden");
        })

        document.getElementById('homeIcon')?.addEventListener('click', () => {
            this.engine.camera.reset()
        });

        document.getElementById('toggle')?.addEventListener('click', () => {

            this.textUI.isOriginal = !this.textUI.isOriginal

            this.updateDreamTexts()

        });

        this.inactivityManager.addEventListener('inactive', () => {
            this.engine.camera.reset();
            this.resetQuery()
            this.engine.camera.enableAutorotate = true
        }
        );

        this.inactivityManager.addEventListener('active', () => {
            this.engine.camera.enableAutorotate = false
        }
        )

    }

    listenForClickEvents() {
        this.engine.raycaster.on('click', (intersections: THREE.Intersection[]) => {
            if (intersections.length > 0) {
                const instanceId = intersections[0].index ? intersections[0].index : 0;
                this.onDreamSelection(instanceId);
            }
        });
    }

    listenForSearchEvents() {
        const field = document.getElementById('userInput') as HTMLInputElement;
        const search = document.getElementById('searchIcon') as HTMLButtonElement;

        field.addEventListener("keypress", function (event: KeyboardEvent) {
            if (event.key === "Enter") {
                event.preventDefault();
                search.click();
            }
        })

        search.addEventListener('click', () => {
            this.queryDreams()
            document.getElementById("keyboardContainer")?.classList.add("hidden");
        })
    }

    listenForNavigateEvent() {
        const buttonNext = document.getElementById('button-next') as HTMLButtonElement;
        buttonNext.addEventListener('click', () => {
            this.navigateToNextDream();
        });

        const buttonPrevious = document.getElementById('button-previous') as HTMLButtonElement;
        buttonPrevious.addEventListener('click', () => {
            this.navigateToPreviousDream();
        });
    }

    queryDreams() {
        const field = document.getElementById('userInput') as HTMLInputElement;

        if (field.value == "" || field.value == " ") {
            this.resetQuery()
            return
        }

        this.updatePointColor(this.queriedIds, this.baseColor)
        this.textUI.showButtons()

        const dreamArray = Array.from(this.dreams.values())
        this.queriedIds = this.search(field.value.trim(), dreamArray)
        const queriedIdsSet = new Set(this.queriedIds);
        this.queriedDreams = dreamArray.filter((d: Dream) => queriedIdsSet.has(d.id));

        this.textUI.updateDreamCounter(this.queriedIds.length.toString())

        if (this.queriedIds.length > 0) {

            if (this.queriedIds) {
                const firstQueriedDreamId = this.queriedIds[0];
                this.selectedId = firstQueriedDreamId;
                this.engine.camera.animateTo(this.dreams!.get(firstQueriedDreamId)!.position);
                this.updatePointColor(this.queriedIds, this.neighborColor)
            }

            //update tree if dreams to select are less than the total
            const queriedIdsSet = new Set(this.queriedIds);
            const filteredPositions = dreamArray
                .filter(d => queriedIdsSet.has(d.id))
                .map(d => d.position);
            this.tree = new kdTree(filteredPositions, Utils.distance, ["x", "y", "z"]);


            this.updateNearest(this.cameraForwardDistance);
        }

    }
    resetQuery() {
        //reset tree distance
        this.tree = new kdTree(Array.from(this.dreams.values()).map(dream => dream.position), Utils.distance, ["x", "y", "z"]);
        this.dreamTexts[0].textMesh.colorRanges = null;
        this.updatePointColor(this.queriedIds, this.baseColor)
        this.queriedIds = []
        this.queryString = ''
        this.textUI.updateDreamCounter("-1")
        this.updateNearest(this.cameraForwardDistance);
    }

    // Called on resize
    resize() { }

    update() {
        if (this.hasCameraChanged() && this.hasCSVLoaded) {
            this.updateNearest(this.cameraForwardDistance)
        }

    }

    // Called when dream selection changes
    onDreamSelection(instanceId: number) {
        if (instanceId != this.selectedId) {
            this.selectedId = instanceId;
            const dreamPos: THREE.Vector3 = this.dreams.get(instanceId)!.position;
            this.engine.camera.animateTo(dreamPos);
            this.engine.camera.update();
            this.updateDreamTextsOpacity();
        }
    }

    // Update dream text opacity with animation
    updateDreamTextsOpacity() {
        this.dreamTexts.forEach((t: TroikaText, i: number) => {
            t.textMesh.fillOpacity = 0
            t.textMesh.outlineOpacity = 0
            let opacity = (i == 0) ? 1 : 0.15;
            gsap.to(t.textMesh, { outlineOpacity: 1, ease: "expo.in", duration: 3.5 })
            gsap.to(t.textMesh, { fillOpacity: opacity, ease: "expo.in", duration: 3.5 })

        });
    }


    updateNearest(stepDistance: number) {
        const futurePos = this.getFuturePosition(stepDistance)
        this.updatePointColor(this.highlightedIds, this.baseColor)
        const relevantDreams = this.queryString === '' ?
            Array.from(this.dreams.values()) :
            this.queriedDreams

        let temp = this.getNearestDreamIndices(relevantDreams, futurePos);
        if (temp) {
            this.highlightedIds = [this.selectedId, ...temp.filter(t => (t != -1 && t != this.selectedId))]

            this.updateDreamTexts()
            this.updatePointColor(this.highlightedIds, this.neighborColor)
        }

    }

    updatePointColor(ids: number[], color: THREE.Color) {
        let colorAttribute = this.points?.geometry.getAttribute('color')
        ids.forEach((id: number) => {
            colorAttribute?.setXYZ(id, color.r, color.g, color.b)

        })

        //@ts-ignore 
        colorAttribute.needsUpdate = true
    }

    hasCameraChanged() {
        if (this.engine.camera.instance.position.equals(this.cameraPos)) return false;

        this.cameraDir = this.engine.camera.instance.getWorldDirection(this.cameraDir).normalize();
        this.cameraPos.copy(this.engine.camera.instance.position);
        return true;
    }

    updateCameraValues() {
        this.cameraPos = this.engine.camera.instance.position.copy(this.cameraPos)
    }

    getFuturePosition(stepDistance: number) {
        return this.engine.camera.instance.position.clone().add(this.cameraDir.clone().multiplyScalar(stepDistance));
    }

    getNearestDreamIndices(dreams: Dream[], futurePos: THREE.Vector3) {
        return this.tree!.nearest(futurePos, Math.min(dreams.length, this.nneighbors - 1))?.map((p: any) => {
            return Array.from(this.dreams.values()).map(dream => dream.position).indexOf(p[0])
        });
    }

    updateDreamTexts() {
        const cameraDir = this.engine.camera.instance.getWorldDirection(new THREE.Vector3()).normalize();
        let regex = new RegExp(`(^|[^\\p{L}\\p{N}])${this.normalizeString(this.queryString)}($|[^\\p{L}\\p{N}])`, 'u');
        
        for (let i = 0; i < this.nneighbors; i++) {
            const dreamEntry = this.dreamTexts.at(i);

            if (i < this.highlightedIds.length) {
                const currentDream: Dream = this.dreams.get(this.highlightedIds[i])!;
                const text = currentDream.getReport(this.textUI.isOriginal);
                if (i == 0) {
                    if (this.queryString != '') {
                        const index = this.normalizeString(text).search(regex);
                        dreamEntry!.textMesh.colorRanges = { 0: 0xfffffff, [index]: this.neighborColor, [index + this.queryString.length + 1]: 0xffffff };
                    }
                    //"│───────────────────────────────────────────────────────────────────────────│ \n\n" + 
                    dreamEntry?.updateText(text)
                }
                else {
                    dreamEntry?.updateText(this.selectDreamContext(text, this.queryString, 15))
                    dreamEntry!.textMesh.colorRanges = null;
                }

                dreamEntry?.updatePosition(cameraDir, currentDream.position.clone(), this.engine.camera.instance.matrixWorld)

            } else {
                dreamEntry?.updateText("") // reset
            }

        }

    }

    selectDreamContext(dreamReport: string, searchTerm: string, contextLength: number): string {
        const words = dreamReport.split(" ");
        if (searchTerm == '') return words.slice(0, 25).join(" ") + "..."

        const index = words.findIndex(word => word.toLowerCase() === searchTerm.toLowerCase());
        if (index === -1) {
            return words.slice(0, 25).join(" ") + "..."; // Search term not found in text
        }
        const startIndex = Math.max(0, index - contextLength);
        const endIndex = Math.min(words.length, index + contextLength + 1);
        return words.slice(startIndex, endIndex).join(" ");
    }

    navigateToNextDream() {
        if (this.queriedIds.length > 0) {
            const currentIndex = this.queriedIds.indexOf(this.selectedId);
            const nextIndex = (currentIndex + 1) % this.queriedIds.length;
            const nextDreamId = this.queriedIds[nextIndex];
            this.onDreamSelection(nextDreamId);
        }
    }

    navigateToPreviousDream() {
        if (this.queriedIds.length > 0) {
            const currentIndex = this.queriedIds.indexOf(this.selectedId);
            const previousIndex = (currentIndex - 1 + this.queriedIds.length) % this.queriedIds.length;
            const previousDreamId = this.queriedIds[previousIndex];
            this.onDreamSelection(previousDreamId);
        }
    }

    async parseCSV() {
        try {
            const response = await fetch('/dreams.csv');
            const csvData = await response.text();
            const scale = 1;
            Papa.parse(csvData, {
                header: true,
                skipEmptyLines: true,
                complete: (result: any) => {
                    result.data.forEach((row: any) => {
                        const id = parseInt(row.id)
                        const x = parseFloat(row.x) * scale;
                        const y = parseFloat(row.y) * scale;
                        const z = parseFloat(row.z) * scale;
                        const dreamReport = String(row.report);
                        const dreamReport_es = String(row.report_es);

                        //const topics = String(row.keywords)

                        const dream = new Dream(id, x, y, z, dreamReport, dreamReport_es);
                        this.dreams?.set(id, dream);

                    })
                },
            });
        } catch (error: any) {
            console.error('Error fetching or parsing CSV:', error.message);
        }
    }

    createScene() {

        this.dreamTexts = new Array(this.nneighbors).fill(null);
        //create texts
        for (let i = 0; i < this.nneighbors; i++) {
            const myText: TroikaText = new TroikaText(this.engine.scene,{
                fontSize: 0.002, 
                color: this.baseColor, 
                maxTextWidth: this.maxTextWidth,
                backgroundColor: 'yellow' 
            });
            this.dreamTexts[i] = myText;
        }


    var geometry = new THREE.BufferGeometry();
    let vertices = []
    let colors = [];
    let c = new THREE.Color(1, 1, 1);

    for (let i = 0; i < this.dreams?.size!; i++) {
        vertices.push(this.dreams.get(i)!.position.x, this.dreams.get(i)!.position.y, this.dreams.get(i)!.position.z);
        colors.push(c.r, c.g, c.b);
    }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const texture = new THREE.TextureLoader().load('sprite.png' ); 
        let material = new THREE.PointsMaterial( { size: 0.08, map: texture, vertexColors: true, blending: THREE.AdditiveBlending, depthTest: false, transparent: true } )
        this.points = new THREE.Points(geometry, material);

        this.engine.scene.add(this.points);
        this.engine.raycaster.setIntersectionObjects([this.points])


        //add axes
        const axesHelper = new THREE.AxesHelper(7);
        axesHelper.setColors(this.axesColor, this.axesColor, this.axesColor)
        this.engine.scene.add(axesHelper);
    }

    normalizeString(str:string) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    }
    search(word: string, dreams: Dream[]): number[] {
        this.queryString = word;
        const indices: number[] = [];
        dreams.forEach((dream, index) => {
            let regex = new RegExp(`(^|[^\\p{L}\\p{N}])${this.normalizeString(this.queryString)}($|[^\\p{L}\\p{N}])`, 'u');
    
            if (regex.test(this.normalizeString(dream.getReport(this.textUI.isOriginal)))) {
                indices.push(index);
            }
        });

        return indices;
    }

}

