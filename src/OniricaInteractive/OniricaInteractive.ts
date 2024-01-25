import * as THREE from 'three';
import { Engine } from '../engine/Engine'
import { Experience } from '../engine/Experience'
import { Resource } from '../engine/Resources'
import { Dream } from './Dream';
import Papa from 'papaparse';
import { TextUI } from './UI/Text';

export class OniricaInteractive implements Experience {
    private textUI: TextUI = new TextUI();
    private dreams: Dream[] = [];
    private mesh: THREE.InstancedMesh | undefined;
    private selectedId: number = -1

    public baseColor = new THREE.Color();
    public highlightColor = new THREE.Color(0xe28743)
    resources: Resource[] = [
    ]

    constructor(private engine: Engine) {
        this.parseCSV().finally(() => {
            this.createScene()
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

    }

    // called on resize
    resize() { }

    // called on each render
    update() {

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
                    console.log(this.dreams);

                },
            });
        } catch (error: any) {
            console.error('Error fetching or parsing CSV:', error.message);
        }
    }

    createScene() {
        const geometry = new THREE.IcosahedronGeometry(0.01, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        this.mesh = new THREE.InstancedMesh(geometry, material, this.dreams.length);
        const matrix = new THREE.Matrix4();
        for (let i = 0; i < this.dreams.length; i++) {
            matrix.setPosition(this.dreams[i].position);
            this.mesh.setMatrixAt(i, matrix);
            this.mesh.setColorAt(i, this.baseColor);
        }
        this.engine.scene.add(this.mesh);
        //add axes
        const axesHelper = new THREE.AxesHelper( 6 );
        axesHelper.setColors(this.highlightColor, this.highlightColor, this.highlightColor)
        this.engine.scene.add( axesHelper );

        //lights
        const light = new THREE.AmbientLight( 0xffffff, 1 ); // soft white light
        this.engine.scene.add( light );


    }


}
