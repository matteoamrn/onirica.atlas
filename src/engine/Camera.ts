import { Engine } from './Engine'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GameEntity } from './GameEntity'
import gsap from 'gsap'

export class Camera implements GameEntity {
  public instance!: THREE.PerspectiveCamera
  private controls!: OrbitControls
  private cameraWorldDir = new THREE.Vector3();
  
  
  private minBounds = new THREE.Vector3(-4);
  private maxBounds = new THREE.Vector3(4);

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
    this.instance.position.z = 0.1
    this.instance.position.y = 0.1
    this.instance.position.x = 0.1

    this.engine.scene.add(this.instance)
  }

  private initControls() {
    this.controls = new OrbitControls(this.instance, this.engine.canvas)
    this.controls.enableDamping = true;
    this.controls.maxDistance = 15;

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

    if (this.controls!.getDistance() < 0.2)
      this.controls.target.add(this.cameraWorldDir.multiplyScalar(0.2));

  }
}
