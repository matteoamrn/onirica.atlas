import * as THREE from 'three';

export class Dream {
  id: number;
  db: string;
  position: THREE.Vector3;
  dreamReport: string;

  constructor(id:number, dreambank: string, x: number, y: number, z: number, dreamReport: string) {
    this.id = id;
    this.db = dreambank 
    this.position = new THREE.Vector3(x, y, z);
    this.dreamReport = dreamReport;
  }

  getDreamInfo(): string {
    return `Dream ID: ${this.id}\nPosition: (${this.position.x}, ${this.position.y}, ${this.position.z})\nReport: ${this.dreamReport}`;
  }

  getReport(){
    return this.dreamReport
  }
}

