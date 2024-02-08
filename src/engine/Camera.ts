import { Engine } from './Engine'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GameEntity } from './GameEntity'

export class Camera implements GameEntity {
  public instance!: THREE.PerspectiveCamera
  private controls!: OrbitControls
  private cameraWorldDir = new THREE.Vector3();
  
  
  private minBounds = new THREE.Vector3(-2, -2, -2);
  private maxBounds = new THREE.Vector3(2, 2, 2);

  constructor(private engine: Engine) {
    this.initCamera()
    this.initControls()
  }

  private initCamera() {
    this.instance = new THREE.PerspectiveCamera(
      35,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.instance.position.z = 0.1
    this.instance.position.y = 0.1
    this.instance.position.x = 0.1

    this.engine.scene.add(this.instance)
  }

  private initControls() {
    this.controls = new OrbitControls(this.instance, this.engine.canvas)
    this.controls.update()
  }

  resize() {
    this.instance.aspect = this.engine.sizes.aspectRatio
    this.instance.updateProjectionMatrix()
  }

  update() {
    this.controls.update()
    this.controls.object.getWorldDirection(this.cameraWorldDir);

    if (this.controls!.getDistance() < 0.2)
      this.controls.target.add(this.cameraWorldDir.multiplyScalar(0.2));

    const cameraPosition = this.instance.position.clone();
    cameraPosition.clamp(this.minBounds, this.maxBounds);
    this.instance.position.copy(cameraPosition);
  }
}
