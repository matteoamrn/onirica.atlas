import * as THREE from 'three';
import { Engine } from '../engine/Engine'
import { Experience } from '../engine/Experience'
import { Resource } from '../engine/Resources'
import { Dream } from './Dream';
import Papa from 'papaparse';
import { TextUI } from './UI/Text';
// @ts-ignore
import { Text, getSelectionRects } from 'troika-three-text'
import { kdTree } from 'kd-tree-javascript'
import gsap from 'gsap'
import Utils from './Utils'
import martianMonoRegular from '../../assets/fonts/MartianMono-Regular.ttf'
import InactivityTracker from './InactivityTracker';

export class OniricaInteractive implements Experience {
    private hasCSVLoaded: boolean = false;
    private cameraForwardDistance: number = 0.5
    private nneighbors: number = 8;
    private textUI: TextUI = new TextUI();
    private dreams: Dream[] = [];
    private cameraPos: THREE.Vector3 = new THREE.Vector3();
    private cameraDir: THREE.Vector3 = new THREE.Vector3();
    private dreamTexts: Text[] = []; // index 0 + nneighbors
    private highlightMesh: THREE.InstancedMesh | undefined

    private inactivityManager:InactivityTracker = InactivityTracker.getInstance()

    private selectedId: number = 0 // the one user clicked on
    private highlightedIds: number[] = [] // the ones close to the camera forward position
    private queriedIds: number[] = []  // the ones that contain the word from user input

    private tree: kdTree<THREE.Vector3> | undefined
    private points: THREE.Points | undefined

    public baseColor = new THREE.Color(0xe6e6e6);
    public selectColor = new THREE.Color(0xffffff)
    public neighborColor = new THREE.Color(0xf8dd5a)
    public axesColor = new THREE.Color(0x4f4846)

    resources: Resource[] = [
    ]
    queryString: string = '';

    constructor(private engine: Engine) {
        this.parseCSV().finally(() => {
            this.createScene();
            this.tree = new kdTree(this.dreams.map(a => a.position), Utils.distance, ["x", "y", "z"]);
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

        document.getElementById("crossIcon")?.addEventListener('click', () =>{
            const inputElement = document.getElementById("userInput") as HTMLInputElement;
            if (inputElement) inputElement.value = "";
            this.textUI.resetKeyboard()
            this.resetQuery()
          })

          document.getElementById('homeIcon')?.addEventListener('click', () => {
              this.engine.camera.reset()
          });

          this.inactivityManager.addEventListener('inactive', () =>{
            this.engine.camera.reset();
            this.resetQuery()
            this.engine.camera.enableAutorotate = true
            }
        );

        this.inactivityManager.addEventListener('active', () =>{
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
        this.updatePointColor(this.queriedIds, this.baseColor)
        this.textUI.showButtons()

        if(field.value == "" || field.value == " ") 
        {
            this.resetQuery()
            return
        }
        this.queriedIds = this.search(field.value, this.dreams)
        this.textUI.updateDreamCounter(this.queriedIds.length.toString())

        if (this.queriedIds.length > 0) {

            if (this.queriedIds) {
                const firstQueriedDreamId = this.queriedIds[0];
                this.selectedId = firstQueriedDreamId;
                this.engine.camera.animateTo(this.dreams.at(firstQueriedDreamId)!.position);
                this.updatePointColor(this.queriedIds, this.neighborColor)
            }

            //update tree if dreams to select are less than the total
            this.tree = new kdTree(this.dreams.filter(d => this.queriedIds.includes(d.id)).map(a => a.position), Utils.distance, ["x", "y", "z"]);

            
            this.updateNearest(this.cameraForwardDistance);
        }    
        
    }
    resetQuery() {
        //reset tree distance
        this.tree = new kdTree(this.dreams.map(a => a.position), Utils.distance, ["x", "y", "z"]);
        this.dreamTexts[0].colorRanges = null;
        this.updatePointColor(this.queriedIds, this.baseColor)
        this.queriedIds = []
        this.queryString = ''
        this.textUI.updateDreamCounter("-1")
        this.updateNearest(this.cameraForwardDistance);
        this.highlightMesh!.instanceMatrix.needsUpdate = true

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
            this.textUI.updateReportText(this.dreams.at(instanceId)!.dreamReport, instanceId.toString());
            this.selectedId = instanceId;
            this.engine.camera.animateTo(this.dreams.at(instanceId)!.position);
            this.engine.camera.update();


            this.updateDreamTextsOpacity();
            //this.updateButtons();
        }
    }

    // Update dream text opacity with animation
    updateDreamTextsOpacity() {
        this.dreamTexts.forEach((t: Text, i:number) => {
            t.fillOpacity = 0
            let opacity = (i == 0) ? 1 : 0.15;
            gsap.to(t, { fillOpacity: opacity, ease: "expo.in", duration: 2.5 })
        });
    }


    updateNearest(stepDistance: number) {
        const futurePos = this.getFuturePosition(stepDistance)
        this.updatePointColor(this.highlightedIds, this.baseColor)

        let temp = this.getNearestDreamIndices(this.queryString == '' ? this.dreams : this.dreams. //cycle over all dreams or filter only ones containing query word
            filter((d: Dream) => this.queriedIds.includes(d.id)), futurePos)
        if (temp) {
            this.highlightedIds = [this.selectedId, ...temp.filter(t => (t != -1 && t != this.selectedId ))]

            this.updatedreamTexts()
            this.updatePointColor(this.highlightedIds, this.neighborColor)
        }

    }

    updatePointColor(ids: number[], color: THREE.Color) {
        let colorAttribute = this.points?.geometry.getAttribute('color')
        ids.forEach((id:number) => {
            colorAttribute?.setXYZ( id, color.r, color.g, color.b ) 

        })
        
        //@ts-ignore 
        colorAttribute.needsUpdate = true
    }

    hasCameraChanged() {
        if (this.engine.camera.instance.position.equals(this.cameraPos)) {
            return false
        }
        this.cameraDir = this.engine.camera.instance.getWorldDirection(this.cameraDir).normalize()
        this.cameraPos.copy(this.engine.camera.instance.position)
        return true
    }

    updateCameraValues() {
        this.cameraPos = this.engine.camera.instance.position.copy(this.cameraPos)
    }

    getFuturePosition(stepDistance: number) {
        return this.engine.camera.instance.position.clone().add(this.cameraDir.clone().multiplyScalar(stepDistance));
    }

    getNearestDreamIndices(dreams: Dream[], futurePos: THREE.Vector3) {
        return this.tree!.nearest(futurePos, Math.min(dreams.length, this.nneighbors-1))?.map((p: any) => {
            return this.dreams.map(d => d.position).indexOf(p[0])
        });
    }

    updatedreamTexts() {
        const cameraDir = this.engine.camera.instance.getWorldDirection(new THREE.Vector3()).normalize();
        for (let i = 0; i < this.nneighbors; i++) {
            const dreamEntry = this.dreamTexts.at(i);

            if (i < this.highlightedIds.length) {
                const currentDream: Dream = this.dreams[this.highlightedIds[i]];
        
                if (i == 0) {
                    if (this.queryString != ''){
                        const startIndex = currentDream.dreamReport.indexOf(this.queryString)
                        const endIndex = startIndex + this.queryString.length;

                        dreamEntry.colorRanges = {0: 0xfffffff, [startIndex]: 0xff0000, [endIndex]: 0xffffff};
                    }
                    dreamEntry.text = currentDream.dreamReport;
                }
                else {
                    dreamEntry.text = this.selectDreamContext(currentDream.dreamReport, this.queryString, 15)
                    dreamEntry.colorRanges = null;
                }
        
                const distance = 0.007;
                const distanceY = 0.003;
                const YVector = new THREE.Vector3(0.0, 1.0, 0.0);
                const perpendicularVector = new THREE.Vector3().crossVectors(cameraDir, YVector).normalize();
                const perpendicularVectorY = new THREE.Vector3().crossVectors(perpendicularVector, cameraDir).normalize();
                const newPosition = currentDream.position.clone().addScaledVector(perpendicularVector, distance).addScaledVector(perpendicularVectorY, distanceY);
                dreamEntry.position.copy(newPosition);
                dreamEntry.rotation.setFromRotationMatrix(this.engine.camera.instance.matrixWorld);
        
            } else {
                dreamEntry.text = ""; // reset
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
                        const topics = String(row.keywords)

                        const dream = new Dream(id, x, y, z, dreamReport, topics);
                        this.dreams.push(dream);

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
            const myText: Text = new Text();
            this.engine.scene.add(myText);
            myText.text = ""
            myText.font = martianMonoRegular;
            myText.fontSize = 0.002;
            myText.color = this.baseColor;
            myText.maxWidth = 0.15
            myText.sync();
            this.dreamTexts[i] = myText;   
        }

        var geometry = new THREE.BufferGeometry();
        let vertices = []
        let colors = [];
        let c = new THREE.Color(1, 1, 1);

        for (let i = 0; i < this.dreams.length; i++) {
            vertices.push(this.dreams[i].position.x, this.dreams[i].position.y, this.dreams[i].position.z);
            colors.push(c.r, c.g, c.b );
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

        const texture = new THREE.TextureLoader().load('sprite.png' ); 
        let material = new THREE.PointsMaterial( { size: 0.04, map: texture, vertexColors: true, blending: THREE.AdditiveBlending, depthTest: false, transparent: true } )
        this.points = new THREE.Points(geometry, material);

        this.engine.scene.add(this.points);
        this.engine.raycaster.setIntersectionObjects([this.points])


        //add axes
        const axesHelper = new THREE.AxesHelper(6);
        axesHelper.setColors(this.axesColor, this.axesColor, this.axesColor)
        this.engine.scene.add(axesHelper);
    }

    search(word: string, dreams: Dream[]): number[] {
        this.queryString = word;
        const indices: number[] = [];
        dreams.forEach((dream, index) => {
            if (dream.dreamReport.includes(" " + word + " ")) {
                indices.push(index);
            }
        });
        return indices;
    }

}

