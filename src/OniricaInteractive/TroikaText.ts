// @ts-ignore
import { Text } from 'troika-three-text'
import * as THREE from 'three';
import martianMonoRegular from '../../assets/fonts/MartianMono-Regular.ttf'

export class TroikaText {
    public textMesh: Text;
    // private backgroundMesh: THREE.Mesh;
    private maxTextWidth:number


    constructor(scene: THREE.Scene, options: Partial<Text> = {}) {
        this.textMesh = new Text();
        this.textMesh.text = "";
        this.textMesh.textAlign = options.justify
        this.textMesh.font = martianMonoRegular;
        this.textMesh.fontSize = options.fontSize;
        this.textMesh.color = options.fontColor;
        this.textMesh.maxWidth = options.maxTextWidth || 0.001
        this.maxTextWidth = options.maxTextWidth
        this.textMesh.outlineColor = 'black'
        this.textMesh.outlineWidth = 0.0003

        this.textMesh.fontSize = options.fontSize || 1;
        this.textMesh.color = options.color || 'black';

        this.textMesh.sync();

        // const geometry = new THREE.PlaneGeometry(1, 1);
        // const material = new THREE.MeshBasicMaterial({ color: options.backgroundColor || 'white', opacity: 0.1 });

        // this.backgroundMesh = new THREE.Mesh(geometry, material);
        // scene.add(this.backgroundMesh);
        scene.add(this.textMesh);
    }


    updateText(newText: string, options: Partial<Text> = {}) {
        this.textMesh.text = newText;

        this.textMesh.sync(() => {
        //     const textBox = this.textMesh.geometry.boundingBox;
        //     if (textBox) {
        //         const width = textBox.max.x - textBox.min.x;
            //     const height = textBox.max.y - textBox.min.y;

            //     this.backgroundMesh.scale.set(width, height, 1);
            //     this.backgroundMesh.position.copy(this.textMesh.position);
            //     this.backgroundMesh.position.x +=  width;
        //}

        });

    }

    updatePosition(cameraDir:THREE.Vector3, dreamCenter:THREE.Vector3, mat: THREE.Matrix4){
        const distance = -this.maxTextWidth * 0.5;
        const distanceY = -0.010;
        const YVector = new THREE.Vector3(0.0, 1.0, 0.0);
        const perpendicularVector = new THREE.Vector3().crossVectors(cameraDir, YVector).normalize();
        const perpendicularVectorY = new THREE.Vector3().crossVectors(perpendicularVector, cameraDir).normalize();
        const newPosition = dreamCenter.clone().addScaledVector(perpendicularVector, distance).addScaledVector(perpendicularVectorY, distanceY);

        // const newPositionMesh = dreamCenter.clone().addScaledVector(perpendicularVectorY, distanceY+this.backgroundMesh.scale.y);
        this.textMesh.position.copy(newPosition);
        this.textMesh.rotation.setFromRotationMatrix(mat);

        // this.backgroundMesh.position.copy(newPositionMesh);
        // this.backgroundMesh.rotation.setFromRotationMatrix(mat);

    }

}