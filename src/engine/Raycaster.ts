import { EventEmitter } from './utilities/EventEmitter'
import * as THREE from 'three'
import { Engine } from './Engine'

export class Raycaster extends EventEmitter {
  private raycaster: THREE.Raycaster
  private pointer: THREE.Vector2
  private intersectionObjects: THREE.Object3D[] = [];

  constructor(private engine: Engine) {
    super()
    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()

    document.addEventListener('mousemove', (event) => {
      const x = (event.clientX / this.engine.sizes.width) * 2 - 1
      const y = -(event.clientY / this.engine.sizes.height) * 2 + 1
      this.setPointer(x, y)
      if (this.listenerCount('move')) {
        this.emit('move', this.getIntersections())
      }
    })

    document.addEventListener('click', (event) => {
      if (!(event.target instanceof HTMLCanvasElement)) return
      const point = this.mouseEventToVector2(event)
      this.setPointer(point.x, point.y)
      this.update()
      if (this.listenerCount('click')) {
        this.emit('click', this.getIntersections())
      }
    })
  }

  public update() {
    this.raycaster.setFromCamera(this.pointer, this.engine.camera.instance)
  }

  public setIntersectionObjects(objects: THREE.Object3D[]) {
    this.intersectionObjects = objects;
  }

  public setPointer(x: number, y: number) {
    this.pointer.x = x
    this.pointer.y = y
  }

  public getIntersections() {
    return this.raycaster.intersectObjects(this.intersectionObjects, true)
  }

  private mouseEventToVector2(event: MouseEvent) {
    const x = (event.clientX / this.engine.sizes.width) * 2 - 1
    const y = -(event.clientY / this.engine.sizes.height) * 2 + 1
    return new THREE.Vector2(x, y)
  }
}
