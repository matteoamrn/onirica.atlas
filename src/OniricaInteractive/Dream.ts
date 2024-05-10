import * as THREE from 'three';

export class Dream {

  id: number;
  position: THREE.Vector3;
  dreamReport: string;
  dreamReport_es: string;
  // topics:string[];

  constructor(id:number, x: number, y: number, z: number, dreamReport: string, dreamReport_es: string) {
    this.id = id;
    this.position = new THREE.Vector3(x, y, z);
    this.dreamReport = dreamReport;
    this.dreamReport_es = dreamReport_es
    //this.topics = topics.replace(".", "").split(",")
  }

  getDreamInfo(): string {
    return `Dream ID: ${this.id}\nPosition: (${this.position.x}, ${this.position.y}, ${this.position.z})\nReport: ${this.dreamReport}`;
  }

  getReport(original: boolean){
    return original ? this.dreamReport : this.dreamReport_es
  }
}

