import * as THREE from 'three';
import { Engine } from '../engine/Engine'
import { Experience } from '../engine/Experience'
import { Resource } from '../engine/Resources'
import { Dream } from './Dream';
import Papa from 'papaparse';
import { TextUI } from './UI/Text';
import { Text } from 'troika-three-text'
import { kdTree } from 'kd-tree-javascript'
import gsap from 'gsap'

function distance (a: THREE.Vector3, b: THREE.Vector3) {
    var deltaX = b.x - a.x;
    var deltaY = b.y - a.y;
    var deltaZ = b.z - a.z;
    var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
    return distance;
}

export class OniricaInteractive implements Experience {
    private hasCSVLoaded:boolean =  false;
    private cameraForwardDistance:number = 0.5
    private nneighbors: number = 15;
    private textUI: TextUI = new TextUI();
    private dreams: Dream[] = [];
    private mesh: THREE.InstancedMesh | undefined;
    private cameraPos: THREE.Vector3 = new THREE.Vector3();
    private cameraDir: THREE.Vector3 = new THREE.Vector3();
    private dreamTexts: Text[] = [];
    private backgroundPlanes: any = [];

    private selectedId: number = -1 // the one user clicked on
    private highlightedIds: number[] = [] // the ones close to the camera forward position
    private queriedIds: number[] = []  // the ones that contain the word from user input

    private tree: kdTree<THREE.Vector3> | undefined

    public baseColor = new THREE.Color();
    public queryColor = new THREE.Color(0xf8dd5a)
    public selectColor = new THREE.Color(0xe3592b)

    resources: Resource[] = [
    ]
    queryString: string = '';


    constructor(private engine: Engine) {
        this.parseCSV().finally(() => {
            this.createScene()

            this.tree = new kdTree(this.dreams.map(a => a.position), distance, ["x", "y", "z"]);
            this.hasCSVLoaded =  true
            this.updateNearest(this.cameraForwardDistance)
        })
    }

    

    init() {

        this.engine.raycaster.on('click', (intersections: THREE.Intersection[]) => {
            if (intersections.length > 0) {
                const instanceId = intersections[0].instanceId ? intersections[0].instanceId : 0
                this.onDreamSelection(instanceId)
            }

            
        });

        const field = document.getElementById('userInput') as HTMLInputElement;
        const search = document.getElementById('button-search') as HTMLButtonElement;  

        field.addEventListener("keypress", function (event: KeyboardEvent) {
            if (event.key === "Enter") {
                event.preventDefault();
                search.click();
            }
        })

        search.addEventListener('click', () => {
            this.queriedIds = this.search(field.value, this.dreams)
            this.textUI.updateDreamCounter(this.queriedIds.length.toString())

            const buttonContainer = document.querySelector('.button-other-dreams') as HTMLDivElement;
            buttonContainer.style.display = this.queriedIds.length > 0 ? 'flex' : 'none';

            if (this.queriedIds) {
                for (let i = 0; i < this.dreams.length; i++) {
                    if (this.queriedIds.includes(i))
                        this.mesh!.setColorAt(i, this.queryColor);
                    else this.mesh!.setColorAt(i, this.baseColor);
                    
                }
                this.mesh!.instanceColor!.needsUpdate = true;

                const firstQueriedDreamId = this.queriedIds[0];
                this.mesh!.setColorAt(firstQueriedDreamId, this.selectColor);
                this.selectedId = firstQueriedDreamId;
                this.textUI.updateReportText(this.dreams.at(firstQueriedDreamId)!.dreamReport, firstQueriedDreamId.toString());
                this.engine.camera.animateTo(this.dreams.at(firstQueriedDreamId)!.position);
            }
            this.updateNearest(this.cameraForwardDistance);

            
        })

        const buttonNext = document.getElementById('button-next') as HTMLButtonElement;
        buttonNext.addEventListener('click', () => {
            this.navigateToNextDream();
        });
        const buttonPrevious = document.getElementById('button-previous') as HTMLButtonElement;
        buttonPrevious.addEventListener('click', () => {
            this.navigateToPreviousDream();
        });

        const buttons = document.querySelectorAll('.button-topic');

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                if (button.textContent != undefined && button.textContent != "") {       
                    console.log(button.textContent.toLowerCase().trim().slice(1))         
                    field.value = button.textContent ? button.textContent.toLowerCase().trim().slice(1) : " ";
                    search.click();
                }
            });
          });
  


    }

    async projectUmap(inputString: string): Promise<any> {
        const url = 'http://127.0.0.1:5000/project/' + inputString;

        const response = await fetch(url, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    }

    // called on resize
    resize() { }

    // called on each render
    update() {
    //if camera pos has changed, update displayed texts
        if (this.hasCameraChanged() && this.hasCSVLoaded) {
            this.updateNearest(this.cameraForwardDistance)
        }
    }

    updateNearest(stepDistance: number) {
        const futurePos = this.getFuturePosition(stepDistance)

        let temp = this.getNearestDreamIndices(this.queryString == '' ? this.dreams : this.dreams. //cycle over all dreams or filter only ones containing query word
        filter((d:Dream) => this.queriedIds.includes(d.id)),  futurePos)
        if (temp) {
            this.highlightedIds = temp
            this.updatedreamTexts()
            this.updateNeighboursColor()
        }    
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
    
    getNearestDreamIndices(dreams:Dream[], futurePos:THREE.Vector3) {
        if (this.queryString != '') //update tree if dreams to select are less than the total
            this.tree = new kdTree(this.dreams.filter(d => this.queriedIds.includes(d.id)).map(a => a.position), distance, ["x", "y", "z"]);

        return this.tree!.nearest(futurePos, Math.min(dreams.length, this.nneighbors))?.map((p: any) => {
            return this.dreams.map(d => d.position).indexOf(p[0])
        });
    }
    
    updatedreamTexts() {
        const cameraDir = this.engine.camera.instance.getWorldDirection(new THREE.Vector3()).normalize();

        for (let i = 0; i < this.nneighbors; i++) {
            const currentDream: Dream = this.dreams[this.highlightedIds[i]]
            const dreamEntry = this.dreamTexts.at(i);
            dreamEntry.text =this.selectDreamContext(currentDream.dreamReport, this.queryString, 15)

            const distance = 0.005;
            const distanceY = 0.002;
            const YVector = new THREE.Vector3(0.0,1.0,0.0);
           // const perpendicularVector = new THREE.Vector3().crossVectors(cameraDir, currentDream.position).normalize();
            const perpendicularVector = new THREE.Vector3().crossVectors(cameraDir, YVector).normalize();
            const perpendicularVectorY = new THREE.Vector3().crossVectors(perpendicularVector, cameraDir).normalize();
            const newPosition = currentDream.position.clone().addScaledVector(perpendicularVector, distance).addScaledVector(perpendicularVectorY,distanceY);
            dreamEntry.position.copy(newPosition);
            dreamEntry.rotation.setFromRotationMatrix(this.engine.camera.instance.matrixWorld);

            dreamEntry.sync();
        }
           
    }

    selectDreamContext(dreamReport: string, searchTerm: string, contextLength: number): string {
        const words = dreamReport.split(" ");
        if (searchTerm == '') return words.slice(0, 25).join(" ") + "..."

        const index = words.findIndex(word => word.toLowerCase() === searchTerm.toLowerCase());
        if (index === -1) {
            return ''; // Search term not found in text
        }
        const startIndex = Math.max(0, index - contextLength);
        const endIndex = Math.min(words.length, index + contextLength + 1);
        return words.slice(startIndex, endIndex).join(" ");
    
    }
    
    
    updateNeighboursColor(){
        const highlightedAndQueriedIds = [...this.highlightedIds, ...this.queriedIds];
        this.dreams.forEach((_d: Dream, i: number) => {
            const color = highlightedAndQueriedIds.includes(i) ? this.queryColor : this.baseColor;
            this.mesh!.setColorAt(i, color);        
        })
        this.mesh!.instanceColor!.needsUpdate = true;

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
        const geometry = new THREE.IcosahedronGeometry(0.004, 3);
        this.dreamTexts = new Array(5).fill(null);

        //create texts
        for (let i = 0; i < this.nneighbors; i++) {
            const myText: Text = new Text();
            this.engine.scene.add(myText);
            //myText.anchorX = '1000%';
            myText.text = ""
            myText.font = "./assets/fonts/MartianMono-Regular.ttf"
            myText.fontSize = 0.003;
            myText.color = this.queryColor;
            myText.maxWidth = 0.15
            myText.sync();
            this.dreamTexts[i] = myText;
        }
        

        let material = new THREE.MeshMatcapMaterial({
            color: 0xbebebd,
            transparent: false,
            //opacity: 0.95,
          });

        this.mesh = new THREE.InstancedMesh(geometry, material, this.dreams.length);
        const matrix = new THREE.Matrix4();
        for (let i = 0; i < this.dreams.length; i++) {
            matrix.setPosition(this.dreams[i].position);
            this.mesh.setMatrixAt(i, matrix);
            this.mesh.setColorAt(i, this.baseColor);
        }
        this.engine.scene.add(this.mesh);
        this.engine.raycaster.setIntersectionObjects([this.mesh])
        //add axes
        const axesHelper = new THREE.AxesHelper(6);
        axesHelper.setColors(this.queryColor, this.queryColor, this.queryColor)
        this.engine.scene.add(axesHelper);

        // //lights
        // const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        // directionalLight.position.set(5, 5, 5);
        // const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
        // directionalLight2.position.set(-5, 5, -5);
        // this.engine.scene.add(directionalLight, directionalLight2);

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


    onDreamSelection(instanceId:number) {
        if (instanceId != this.selectedId) {
            this.mesh!.setColorAt(this.selectedId, this.baseColor.setHex(0xffffff));
            this.mesh!.setColorAt(instanceId, this.selectColor);
            this.textUI.updateReportText(this.dreams.at(instanceId)!.dreamReport, instanceId.toString())
            this.mesh!.instanceColor!.needsUpdate = true
            this.selectedId = instanceId;
            
        }
        this.engine.camera.animateTo(this.dreams.at(instanceId)!.position)
        this.dreamTexts.forEach((t:Text) => {
            gsap.to(t, {fillOpacity: 0, ease: "expo.out", duration:0.5, onComplete: () => {
                gsap.to(t, {fillOpacity: 1, ease: "expo.in", duration:2.})
            }})
    
        });
        const buttons = document.querySelectorAll('.button-topic');

        buttons.forEach((button, id) => {
            button!.textContent = this.dreams.at(this.selectedId)!.topics[id];
            });    
    }
    
}

