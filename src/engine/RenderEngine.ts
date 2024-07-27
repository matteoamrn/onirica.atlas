import { WebGLRenderer } from 'three'
import { Engine } from './Engine'
import { GameEntity } from './GameEntity'
import {EffectComposer, EffectPass, VignetteEffect, RenderPass } from 'postprocessing'
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer'

export class RenderEngine implements GameEntity {
  public readonly renderer: WebGLRenderer
  public cssRenderer: CSS3DRenderer;

  composer: EffectComposer

  constructor(private engine: Engine) {
    this.renderer = new WebGLRenderer({
      canvas: this.engine.canvas,
      antialias: true,
    })

    this.renderer.setClearColor('#000000')
    this.renderer.setSize(this.engine.sizes.width, this.engine.sizes.height)
    this.renderer.setPixelRatio(Math.min(this.engine.sizes.pixelRatio, 2))

    this.composer = new EffectComposer(this.renderer)

    const renderPass = new RenderPass(
      this.engine.scene,
      this.engine.camera.instance
    )

    const vignetteEffect = new VignetteEffect({
      eskil: false,
      offset: 0.35,
      darkness: 1.0
    });

    const effectPass = new EffectPass(
			this.engine.camera.instance,
			vignetteEffect,
		);

    this.composer.addPass(renderPass)
    this.composer.addPass(effectPass)

    this.cssRenderer = new CSS3DRenderer();
    this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
    this.cssRenderer.domElement.style.position = 'absolute';
    this.cssRenderer.domElement.style.top = '0px';
    this.cssRenderer.domElement.style.pointerEvents = 'none';
    
    document.body.appendChild(this.cssRenderer.domElement);  
  }

  update() {
    this.composer.render();
    this.cssRenderer.render(this.engine.CSSscene, this.engine.camera.instance);

  }

  resize() {
    this.renderer.setSize(this.engine.sizes.width, this.engine.sizes.height)
    this.composer.setSize(this.engine.sizes.width, this.engine.sizes.height)
    this.cssRenderer.setSize(this.engine.sizes.width, this.engine.sizes.height);
    
    this.composer.render()
    this.cssRenderer.render(this.engine.CSSscene, this.engine.camera.instance)

  }
}
