import * as THREE from 'three';
import { Engine } from '../engine/Engine'
import { Experience } from '../engine/Experience'
import { Resource } from '../engine/Resources'
import { Dream } from './Dream';
import Papa from 'papaparse';
import { TextUI } from './UI/Text';
import { Text } from 'troika-three-text'
import { kdTree } from 'kd-tree-javascript'

function distance (a: THREE.Vector3, b: THREE.Vector3) {
    var deltaX = b.x - a.x;
    var deltaY = b.y - a.y;
    var deltaZ = b.z - a.z;
    var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
    return distance;
}

export class OniricaInteractive implements Experience {
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
        })
    }

    init() {
        this.engine.raycaster.on('click', (intersections: THREE.Intersection[]) => {
            if (intersections.length > 0) {
                const instanceId = intersections[0].instanceId ? intersections[0].instanceId : 0
                if (instanceId != this.selectedId) {
                    this.mesh!.setColorAt(this.selectedId, this.baseColor.setHex(0xffffff));
                    this.mesh!.setColorAt(instanceId, this.selectColor);
                    this.textUI.updateReportText(this.dreams.at(instanceId)!.dreamReport, instanceId.toString())
                    this.mesh!.instanceColor!.needsUpdate = true
                    this.selectedId = instanceId;

                }
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
            if (this.queriedIds) {
                for (let i = 0; i < this.dreams.length; i++) {
                    if (this.queriedIds.includes(i))
                        this.mesh!.setColorAt(i, this.queryColor);
                    else this.mesh!.setColorAt(i, this.baseColor);
                }
                this.mesh!.instanceColor!.needsUpdate = true
            }
            this.updateNearest(0.7);
            // this.projectUmap(inputValue).then((result: any) => {
            //     this.highlightSphere!.position.x = parseFloat(result.x);
            //     this.highlightSphere!.position.y = parseFloat(result.y);
            //     this.highlightSphere!.position.z = parseFloat(result.z);
            // })
        })

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
        if (this.hasCameraChanged()) {
            this.updateNearest(0.7)
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
            dreamEntry.text = currentDream.dreamReport.substring(0, 50)
           // const camToDream = currentDream.position.clone().sub(this.engine.camera.instance.position.clone())

            const distance = 0.005;
            const distanceY = 0.002;
            const YVector = new THREE.Vector3(0.0,1.0,0.0);
           // const perpendicularVector = new THREE.Vector3().crossVectors(cameraDir, currentDream.position).normalize();
            const perpendicularVector = new THREE.Vector3().crossVectors(cameraDir, YVector).normalize();
            const perpendicularVectorY = new THREE.Vector3().crossVectors(perpendicularVector, cameraDir).normalize();
            const newPosition = currentDream.position.clone().addScaledVector(perpendicularVector, distance).addScaledVector(perpendicularVectorY,distanceY);
            
            //const textWidth = dreamEntry.layout.width;
            //dreamEntry.position.copy(newPosition).addScaledVector(cameraDir, -textWidth / 2);
            dreamEntry.position.copy(newPosition);
            dreamEntry.rotation.setFromRotationMatrix(this.engine.camera.instance.matrixWorld);
    
            dreamEntry.sync();
            //console.log(newPosition);
            //console.log(dreamEntry.position);
        }

            // dreamEntry.text = currentDream.dreamReport.substring(0, 50)
            // dreamEntry.position.x = currentDream.position.x + 0.008
            // dreamEntry.position.y = currentDream.position.y + 0.006
            // dreamEntry.position.z = currentDream.position.z
            
            // dreamEntry.quaternion.copy(this.engine.camera.instance.quaternion)
            // this.backgroundPlanes.at(i).position.x = currentDream.position.x 
            // this.backgroundPlanes.at(i).position.y = currentDream.position.y
            // this.backgroundPlanes.at(i).position.z = currentDream.position.z
            // this.backgroundPlanes.at(i).quaternion.copy(this.engine.camera.instance.quaternion)


           
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

                        const dream = new Dream(id, x, y, z, dreamReport);
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
            myText.sync();
            this.dreamTexts[i] = myText;
            // const planeGeometry = new THREE.PlaneGeometry(0.1, 0.01);
            // const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 });
            // const plane = new THREE.Mesh(planeGeometry, planeMaterial);
            // this.backgroundPlanes.push(plane);
            // this.engine.scene.add(plane);
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



}
