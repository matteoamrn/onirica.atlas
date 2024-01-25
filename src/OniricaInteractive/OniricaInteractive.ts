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

    baseColor = new THREE.Color();

    resources: Resource[] = [
    ]

    constructor(private engine: Engine) {
        this.parseCSV().finally(() => {
            this.createMesh()
        })
    }

    init() {
        this.engine.raycaster.on('click', (intersections: THREE.Intersection[]) => {
            if (intersections.length > 0) {
                const instanceId = intersections[0].instanceId ? intersections[0].instanceId : 0
                if (instanceId != this.selectedId) {
                    this.mesh!.setColorAt(this.selectedId, this.baseColor.setHex(0xffffff));
                    this.mesh!.setColorAt(instanceId, this.baseColor.setHex(Math.random() * 0xffffff));
                    this.textUI.updateReportText(this.dreams.at(instanceId)!.dreamReport)
                    this.mesh!.instanceColor!.needsUpdate = true

                    console.log(instanceId, this.selectedId)

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
            const scale = 0.001;
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

    createMesh() {
        const geometry = new THREE.IcosahedronGeometry(0.01, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.mesh = new THREE.InstancedMesh(geometry, material, this.dreams.length);

        const matrix = new THREE.Matrix4();
        for (let i = 0; i < this.dreams.length; i++) {
            matrix.setPosition(this.dreams[i].position);
            this.mesh.setMatrixAt(i, matrix);
            this.mesh.setColorAt(i, this.baseColor);

        }

        this.engine.scene.add(this.mesh);
    }


}
