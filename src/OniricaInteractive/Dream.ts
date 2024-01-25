import * as THREE from 'three';

export class Dream {

  id: number;
  position: THREE.Vector3;
  dreamReport: string;

  constructor(id:number, x: number, y: number, z: number, dreamReport: string) {
    this.id = id;
    this.position = new THREE.Vector3(x, y, z);
    this.dreamReport = dreamReport;
  }

  getDreamInfo(): string {
    return `Dream ID: ${this.id}\nPosition: (${this.position.x}, ${this.position.y}, ${this.position.z})\nReport: ${this.dreamReport}`;
  }
}

