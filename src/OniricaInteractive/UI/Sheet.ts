import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer'
import './sheet.scss'
import { Engine } from '../../engine/Engine'
import gsap from 'gsap'

export type TextConfig = {
  title?: string
  report?: string
  documentTitle?: string
}

export class Sheet {
    container: HTMLDivElement
    cssObject: CSS3DObject
    engine: Engine

  constructor(engine: Engine) {
        this.engine = engine;
        this.container = document.createElement('div');
        this.container.classList.add('main');
        this.container.innerHTML = 
        `
        <div class="dream-card">
        <i id="card-exit" class="fas fa-times" ></i>

            <h1>Dream no. 748 | NotREM (ST4: deep sleep)</h1>
            <p>I had to prepare the car, I needed to put suitcases in it, some luggage, they were suitcases, some packages, everything was quite confusing. It was me, and there were two of my friends (who took an exam with me today). These packages had the shape of human body organs. It was a road near a pine forest. We didn't talk, just loaded these strange packages.</p>
            <div class="details">
                <div class="detail">Age: 20-30</div>
                <div class="detail">Years: 1990</div>
                <div class="detail">Dreamers participating in the dream: 3</div>
                <div class="detail">Defined environment: Y</div>
                <div class="detail">Number of defined characters: 3</div>
                <div class="detail">Dimensional distortions: N</div>
                <div class="detail">Emotions: 2</div>
                <div class="detail">Number of scenes: 1</div>
                <div class="detail">Gender: F</div>
                <div class="detail">Minutes of sleep before waking up: 145</div>
                <div class="detail">Pleasure sees himself from the outside: 2</div>
                <div class="detail">Plausibility: 2</div>
                <div class="detail">Undefined number of characters: 0</div>
                <div class="detail">Space-time distortions: N</div>
                <div class="detail">Body sensations: N</div>
                <div class="detail">Narrative continuity: Y</div>
            </div>
    </div>
    `
    this.container.style.opacity = '0';
    this.cssObject = new CSS3DObject(this.container);
    this.cssObject.element.children[0].children[0].addEventListener('click', () => {
        gsap.to(this.container.style, { opacity: 0, ease: "expo.out", duration: 1.5 })
    })
    this.cssObject.element.style.pointerEvents = 'none';

    this.cssObject.scale.set(0.0001, 0.0001, 0.0001)
    engine.CSSscene.add(this.cssObject);
    
}

update(){
    this.cssObject.lookAt(this.engine.camera.instance.position)

}
updatePosition(x: number, y: number, z: number) {
    this.cssObject.position.set(x, y, z)
}
}
