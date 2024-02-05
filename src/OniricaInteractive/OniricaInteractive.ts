import * as THREE from 'three';
import { Engine } from '../engine/Engine'
import { Experience } from '../engine/Experience'
import { Resource } from '../engine/Resources'
import { Dream } from './Dream';
import Papa from 'papaparse';
import { TextUI } from './UI/Text';
import { Text } from 'troika-three-text'
import { kdTree } from 'kd-tree-javascript'

export class OniricaInteractive implements Experience {
    private nneighbors: number = 10
    private textUI: TextUI = new TextUI();
    private dreams: Dream[] = [];
    private mesh: THREE.InstancedMesh | undefined;
    private cameraDir: THREE.Vector3 = new THREE.Vector3();
    private selectedDreams: Text[] = [];

    private selectedId: number = -1
    private highlightedIds: number[] = []
    private highlightSphere: THREE.Mesh | undefined
    private tree: kdTree<THREE.Vector3> | undefined

    public baseColor = new THREE.Color();
    public highlightColor = new THREE.Color(0xf57614)
    resources: Resource[] = [
    ]


    constructor(private engine: Engine) {
        this.parseCSV().finally(() => {
            this.createScene()
            //now the mesh has been created, initialize kd tree

            var distance = function (a: THREE.Vector3, b: THREE.Vector3) {
                var deltaX = b.x - a.x;
                var deltaY = b.y - a.y;
                var deltaZ = b.z - a.z;

                var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

                return distance;
            }

            this.tree = new kdTree(this.dreams.map(a => a.position), distance, ["x", "y", "z"]);
        })
    }

    init() {
        this.engine.raycaster.on('click', (intersections: THREE.Intersection[]) => {
            if (intersections.length > 0) {
                const instanceId = intersections[0].instanceId ? intersections[0].instanceId : 0
                if (instanceId != this.selectedId) {
                    this.mesh!.setColorAt(this.selectedId, this.baseColor.setHex(0xffffff));
                    this.mesh!.setColorAt(instanceId, this.highlightColor);
                    this.textUI.updateReportText(this.dreams.at(instanceId)!.dreamReport)
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
            const inputValue = field.value;
            this.highlightedIds = this.search(inputValue, this.dreams)
            if (this.highlightedIds) {
                for (let i = 0; i < this.dreams.length; i++) {
                    if (this.highlightedIds.includes(i))
                        this.mesh!.setColorAt(i, this.highlightColor);
                    else this.mesh!.setColorAt(i, this.baseColor);
                }
                this.mesh!.instanceColor!.needsUpdate = true

            }

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
        this.cameraDir = this.engine.camera.instance.getWorldDirection(this.cameraDir).normalize()
        let stepDistance = 0.5
        let futurePos = this.engine.camera.instance.position.clone().add(this.cameraDir.clone().multiplyScalar(stepDistance));

        let tmp = this.tree?.nearest(futurePos, this.nneighbors).map((p: any) => {
            return this.dreams.map(d => d.position).indexOf(p[0])
        })
        if (tmp) {
            this.highlightedIds = tmp
            for (let i = 0; i < this.dreams.length; i++) {
                if (this.highlightedIds.includes(i))
                    {
                        this.mesh!.setColorAt(i, this.highlightColor);
                    }
                else {
                        this.mesh!.setColorAt(i, this.baseColor);
                }
            }
            this.mesh!.instanceColor!.needsUpdate = true
            for (let i = 0; i < this.nneighbors; i++) {
                const currentDream:Dream = this.dreams[this.highlightedIds[i]]
                this.selectedDreams.at(i).text = currentDream.dreamReport.substring(0, 50)
                this.selectedDreams.at(i).position.x = currentDream.position.x
                this.selectedDreams.at(i).position.y = currentDream.position.y + 0.02
                this.selectedDreams.at(i).position.z = currentDream.position.z
                this.selectedDreams.at(i).lookAt(this.engine.camera.instance.position)
            }
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
        const geometry = new THREE.IcosahedronGeometry(0.008, 1);
        this.selectedDreams = new Array(5).fill(null);          
          
        //create texts
        for (let i = 0; i < this.nneighbors; i++) {
            const myText:Text = new Text();
            this.engine.scene.add(myText);
            myText.text = ""
            myText.font = "./assets/fonts/MartianMono-Regular.ttf"
            myText.fontSize = 0.01;
            myText.color = this.highlightColor;
            myText.sync();
            this.selectedDreams[i] = myText;
        }

        let material = new THREE.MeshStandardMaterial({
            color: 0xbebeb6,
            transparent: true,
            opacity: 0.95,
        }
        );
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
        axesHelper.setColors(this.highlightColor, this.highlightColor, this.highlightColor)
        this.engine.scene.add(axesHelper);

        //lights
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight2.position.set(-5, 5, -5);
        this.engine.scene.add(directionalLight, directionalLight2);

        //sphere
        const sphereMat = new THREE.MeshBasicMaterial({
            color: this.highlightColor,
            transparent: true,
            opacity: 0.5,
        });
        const geo = new THREE.SphereGeometry(0.25, 32, 32);
        this.highlightSphere = new THREE.Mesh(geo, sphereMat);
        this.highlightSphere.translateX(10000);
        this.engine.scene.add(this.highlightSphere)

    }

    search(word: string, dreams: Dream[]): number[] {
        const indices: number[] = [];
        dreams.forEach((dream, index) => {
            if (dream.dreamReport.includes(" " + word + " ")) {
                indices.push(index);
            }
        });
        return indices;
    }



}
