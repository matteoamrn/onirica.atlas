import { WebGLRenderer } from 'three'
import { Engine } from './Engine'
import * as THREE from 'three'
import { GameEntity } from './GameEntity'
import { BlendFunction, DepthEffect, DepthOfFieldEffect, EffectComposer, EffectPass, VignetteEffect, RenderPass } from 'postprocessing'

export class RenderEngine implements GameEntity {
  public readonly renderer: WebGLRenderer

  composer: EffectComposer

  constructor(private engine: Engine) {
    this.renderer = new WebGLRenderer({
      canvas: this.engine.canvas,
      antialias: true,
    })


    this.renderer.toneMapping = THREE.CineonToneMapping
    this.renderer.toneMappingExposure = 1.75
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.setClearColor('#000000')
    this.renderer.setSize(this.engine.sizes.width, this.engine.sizes.height)
    this.renderer.setPixelRatio(Math.min(this.engine.sizes.pixelRatio, 2))

    this.composer = new EffectComposer(this.renderer)

    const renderPass = new RenderPass(
      this.engine.scene,
      this.engine.camera.instance
    )

    const depthOfFieldEffect = new DepthOfFieldEffect(this.engine.camera.instance, {
      focusDistance: 0.1,
      focalLength: 2,
      bokehScale: 8,
      height: 2048
    });

    //this.engine.scene.fog = new THREE.Fog( 0x000000, 2.5, 20);

    const depthEffect = new DepthEffect({
      blendFunction: BlendFunction.SKIP
    });

    const vignetteEffect = new VignetteEffect({
      eskil: false,
      offset: 0.35,
      darkness: 1.0
    });

    const effectPass = new EffectPass(
			this.engine.camera.instance,
			vignetteEffect,
			depthEffect
		);

    this.composer.addPass(renderPass)
    this.composer.addPass(effectPass)

  }

  update() {
    this.composer.render();

  }

  resize() {
    this.renderer.setSize(this.engine.sizes.width, this.engine.sizes.height)
    this.composer.setSize(this.engine.sizes.width, this.engine.sizes.height)
    this.composer.render()
  }
}
