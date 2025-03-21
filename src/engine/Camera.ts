import { Engine } from './Engine'
import * as THREE from 'three'

import { GameEntity } from './GameEntity'
import CameraControls from 'camera-controls';


CameraControls.install({ THREE: THREE });
const clock = new THREE.Clock()

export class Camera implements GameEntity {
  public instance!: THREE.PerspectiveCamera
  private controls!: CameraControls;

  private initPos = new THREE.Vector3(2, 5, 13);
  private cameraWorldDir: THREE.Vector3 = new THREE.Vector3(0)
  public enableAutorotate: boolean = true;
  public firstTime: boolean = true

  constructor(private engine: Engine) {
    this.initCamera()
    this.initControls()
  }

  private initCamera() {
    this.instance = new THREE.PerspectiveCamera(
      35,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    )
    this.instance.position.set(this.initPos.x, this.initPos.y, this.initPos.z)

    this.engine.scene.add(this.instance)
  }

  private initControls() {
    this.controls = new CameraControls(this.instance, this.engine.canvas)
    this.controls.minDistance = 0.1;
    this.controls.maxDistance = 14;
    this.controls.smoothTime = 1.9
    this.controls.dollyToCursor = true
    this.controls.dollySpeed = 0.7
    this.controls.mouseButtons.right = CameraControls.ACTION.ROTATE
  }

  resize() {
    this.instance.aspect = this.engine.sizes.aspectRatio
    this.instance.updateProjectionMatrix()
  }

  animateTo(target_position: THREE.Vector3) {
    this.lock();
    // Find camera direction
    const new_camera_dir = this.instance.position.clone().sub(target_position).normalize();

    // Find new camera position along the vector going from target to actual camera pos at a fixed distance
    const camera_pos = target_position.clone().add(new_camera_dir.multiplyScalar(0.35));

    // Animate camera to new position and set look at target position
    this.controls.moveTo(camera_pos.x, camera_pos.y, camera_pos.z, true);
    this.controls.setLookAt(camera_pos.x, camera_pos.y, camera_pos.z, target_position.x, target_position.y, target_position.z, true);
    this.unlock()
  }


  update() {
    const delta = clock.getDelta();
    this.controls.update(delta)

    this.controls.camera.getWorldDirection(this.cameraWorldDir)

    if (this.enableAutorotate) {
      this.controls.azimuthAngle += 3. * delta * THREE.MathUtils.DEG2RAD;

    }
    if (this.controls.distance < 0.2) {
      var new_target = this.instance.position.clone().add(this.cameraWorldDir.normalize().multiplyScalar(0.25))
      this.controls.setOrbitPoint(new_target.x, new_target.y, new_target.z)
    }



  }

  reset() {
    this.controls.setLookAt(this.initPos.x, this.initPos.y, this.initPos.z, 0, 0, 0, true)
  }

  lock() {
    this.controls.enabled = false
  }

  unlock() {
    this.controls.enabled = true
  }

}
