import * as THREE from 'three';
import { Engine } from '../engine/Engine';
import { kdTree } from 'kd-tree-javascript';
import { DreamManager } from './DreamManager';
import Utils from './utils/Utils';
import { Dream } from './Dream';
import { SceneManager } from './SceneManager';
import COLORS from './utils/Colors';

export class CameraManager {
  private engine: Engine;
  private dreamManager: DreamManager;
  private dreams: Dream[] = []
  private tree: kdTree<THREE.Vector3> | undefined;
  private cameraPos: THREE.Vector3;
  private cameraDir: THREE.Vector3;
  private cameraForwardDistance: number;
  private selectedId: number;
  private highlightedIds: number[];
  private queriedIds: number[] = [];
  private nneighbors = 8
  private _currentQuery:string = ''
  private sceneManager: SceneManager;

  private queriedDreams: Dream[] = []

  constructor(engine: Engine, _dreamManager: DreamManager, sceneManager: SceneManager, cameraForwardDistance: number) {
    this.engine = engine;
    this.sceneManager = sceneManager;
    this.dreamManager = _dreamManager;
    this.dreams = this.dreamManager.getAllDreams()
    this.tree = new kdTree(this.dreamManager.getAllDreams().map((dream) => dream.position), Utils.distance, ['x', 'y', 'z']);
    this.cameraPos = new THREE.Vector3();
    this.cameraDir = new THREE.Vector3();
    this.cameraForwardDistance = cameraForwardDistance;
    this.selectedId = 0;
    this.highlightedIds = [];
    this.queriedIds = [];
  }

  update(query: string) {
    this._currentQuery = query
    if (this.hasCameraChanged()) {
      this.updateNearest(this.cameraForwardDistance);
    }
  }

  onDreamSelection(instanceId: number) {
    //this.engine.camera.lock()
    if (instanceId !== this.selectedId) {
      this.selectedId = instanceId;
      const dreamPos = this.dreamManager.getDream(instanceId)!.position;

      if (dreamPos) {
        this.engine.camera.animateTo(dreamPos);
        this.engine.camera.update();
      }
    }
  }

  private hasCameraChanged(): boolean {
    if (this.engine.camera.instance.position.equals(this.cameraPos)) return false;

    this.cameraDir = this.engine.camera.instance.getWorldDirection(this.cameraDir).normalize();
    this.cameraPos.copy(this.engine.camera.instance.position);
    return true;
  }

  updateNearest(stepDistance: number) {
    const futurePos = this.getFuturePosition(stepDistance)
    this.sceneManager.updatePointColor(this.highlightedIds, COLORS.BASE)
    const relevantDreams = this._currentQuery === '' ?
        this.dreams :
        this.queriedDreams

    let temp = this.getNearestDreamIndices(relevantDreams, futurePos);
    if (temp) {
        this.highlightedIds = [
            this.selectedId,
            ...temp.filter(t => t !== -1 && t !== this.selectedId)
        ];
        this.sceneManager.updateDreamTexts(this.highlightedIds, this._currentQuery)
        if (this._currentQuery != '' && !this.queriedIds.includes(this.selectedId)) 
            this.highlightedIds = this.highlightedIds.filter((n:number) => n != this.selectedId)

        this.sceneManager.updatePointColor(this.highlightedIds, COLORS.NEIGHBOR)
    }

}

  private getFuturePosition(stepDistance: number): THREE.Vector3 {
    return this.engine.camera.instance.position.clone().add(this.cameraDir.clone().multiplyScalar(stepDistance));
  }

  private getNearestDreamIndices(dreams: Dream[], futurePos: THREE.Vector3): number[] {
        return this.tree!.nearest(futurePos, Math.min(dreams.length, this.nneighbors - 1))?.map((p: any) => {
            return this.dreams.map(dream => dream.position).indexOf(p[0])
        });
  }

  setQueriedIds(queriedIds: number[]) {
    if (this.queriedIds.length > 0) {

    this.queriedIds = queriedIds;
    const queriedIdsSet = new Set(this.queriedIds);
    this.queriedDreams = this.dreams.filter((d: Dream) => queriedIdsSet.has(d.id));


    const firstQueriedDreamId = this.queriedIds[0];
    this.selectedId = firstQueriedDreamId;
    this.engine.camera.animateTo(this.dreams![firstQueriedDreamId].position);
    this.sceneManager.updatePointColor(this.queriedIds, COLORS.NEIGHBOR)
    

    const filteredPositions = this.dreamManager.getAllDreams()
        .filter(d => queriedIdsSet.has(d.id))
        .map(d => d.position);
    this.tree = new kdTree(filteredPositions, Utils.distance, ["x", "y", "z"]);


    this.updateNearest(this.cameraForwardDistance);
    }

}

  get _queriedIds(): number[] {
    return this.queriedIds;
  }


  getHighlightedIds(): number[] {
    return this.highlightedIds;
  }

  getSelectedId(): number {
    return this.selectedId;
  }
}
