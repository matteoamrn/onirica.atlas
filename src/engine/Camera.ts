import { Engine } from './Engine'
import * as THREE from 'three'

import { GameEntity } from './GameEntity'
import gsap from 'gsap'
import { TrackballControls } from './controls/TrackballControls'

export class Camera implements GameEntity {
  public instance!: THREE.PerspectiveCamera
  private controls!: TrackballControls
  private cameraWorldDir = new THREE.Vector3();
  
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
    this.instance.position.z = 2
    this.instance.position.y = 13.
    this.instance.position.x = 13.

    this.engine.scene.add(this.instance)
  }

  private initControls() {
    this.controls = new TrackballControls(this.instance, this.engine.canvas)
    // this.controls.touches.ONE = THREE.TOUCH.PAN;
    // this.controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;  
      this.controls.maxDistance = 15;

    this.controls.rotateSpeed = 0.8;
    this.controls.zoomSpeed = 0.1;
    this.controls.panSpeed = 0.2

    this.controls.update()
  }

  resize() {
    this.instance.aspect = this.engine.sizes.aspectRatio
    this.instance.updateProjectionMatrix()
  }

  animateTo(target_position:THREE.Vector3) {
    const new_camera_dir = this.instance.position.clone().sub(target_position).normalize().multiplyScalar(0.4)
    const pos = target_position.clone().add(new_camera_dir)
    gsap.to(this.instance.position, {x: pos.x, y:pos.y, z:pos.z, duration: 2.5, ease: "power2.inOut"});
    gsap.to(this.controls.target, {x: target_position.x, y:target_position.y, z: target_position.z, duration: 2.5, ease: "power2.inOut"})
}


  update() {
    this.controls.update()
    this.controls.object.getWorldDirection(this.cameraWorldDir);

    // if (this.controls!.getDistance() < 0.2)
    //   this.controls.target.add(this.cameraWorldDir.multiplyScalar(0.2));
  }
}
