import * as THREE from 'three';
import { Engine } from '../engine/Engine';
import { Dream } from './Dream';
import { TroikaText } from './TroikaText';
import fragmentShader from '../glsl/point.frag';
import vertexShader from '../glsl/point.vert';
import COLORS from './utils/Colors';
import gsap from 'gsap'

export class SceneManager {
  private engine: Engine;
  private dreams: Map<number, Dream>;
  private dreamTexts: TroikaText[];
  private points: THREE.Points | undefined;
  private material: THREE.ShaderMaterial | undefined;
  private baseColor: THREE.Color;
  private neighborColor: THREE.Color;
  private axesColor: THREE.Color;
  private maxTextWidth: number;
  nneighbors: number;

  constructor(engine: Engine, dreams: Map<number, Dream>, nneighbors: number) {
    this.engine = engine;
    this.dreams = dreams;
    this.dreamTexts = [];
    this.baseColor = COLORS.BASE;
    this.neighborColor = COLORS.NEIGHBOR;
    this.axesColor = COLORS.AXES;
    this.maxTextWidth = 0.1;
    this.nneighbors = nneighbors
  }

  createScene() {
    this.createDreamTexts();
    this.createPointsGeometry();
    this.createAxesHelper();
  }

  private createDreamTexts() {
    for (let i = 0; i < this.nneighbors; i++) {
      const dreamText = new TroikaText(this.engine.scene, {
        fontSize: 0.002,
        color: this.baseColor,
        maxTextWidth: this.maxTextWidth,
      });
      this.dreamTexts.push(dreamText);
    }
  }

  private createPointsGeometry() {
    const geometry = new THREE.BufferGeometry();
    // @ts-ignore
    let vertices = [], colors = [];
    const c = new THREE.Color(0.9, 0.9, 0.9);

    for (const dream of this.dreams.values()) {
      vertices.push(dream.position.x, dream.position.y, dream.position.z);
      colors.push(c.r, c.g, c.b);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    // @ts-ignore
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const texture = new THREE.TextureLoader().load('sprite.png');

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        cameraPosition: { value: this.engine.camera.instance.position },
        size: { value: 70.0 },
        colorNear: { value: new THREE.Color(0xffffff) },
        colorFar: { value: new THREE.Color(0x000000) },
        pointTexture: { value: texture },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      blending: THREE.NormalBlending,
      transparent: true,
    });

    this.points = new THREE.Points(geometry, this.material);
    this.engine.scene.add(this.points);
    this.engine.raycaster.setIntersectionObjects([this.points]);
  }

  private createAxesHelper() {
    const axesHelper = new THREE.AxesHelper(7);
    axesHelper.setColors(this.axesColor, this.axesColor, this.axesColor);
    this.engine.scene.add(axesHelper);
  }

  updateDreamTexts(highlightedIds: number[], queryString: string) {
    const cameraDir = this.engine.camera.instance.getWorldDirection(new THREE.Vector3()).normalize();
    const regex = new RegExp(`(^|[^\\p{L}\\p{N}])${this.normalizeString(queryString)}($|[^\\p{L}\\p{N}])`, 'u');

    for (let i = 0; i < this.dreamTexts.length; i++) {
        const dreamText = this.dreamTexts[i];
        const dream = this.dreams.get(highlightedIds[i]);
  
        if (dream) {
          const text = dream.getReport();
  
          if (i === 0) {
            if (queryString !== '') {
              const index = this.normalizeString(text).search(regex);
              dreamText.textMesh.colorRanges = {
                0: 0xffffff,
                [index]: this.neighborColor,
                [index + queryString.length + 1]: 0xffffff,
              };
            }
            dreamText.updateText(text);
          } else {
            dreamText.updateText(this.selectDreamContext(text, queryString, 15));
            dreamText.textMesh.colorRanges = null;
          }
  
          dreamText.updatePosition(cameraDir, dream.position.clone(), this.engine.camera.instance.matrixWorld);
        } else {
          dreamText.updateText('');
        }
      }
    }
  
    updatePointColor(ids: number[], color: THREE.Color) {
      const colorAttribute = this.points?.geometry.getAttribute('color');
      ids.forEach((id) => {
        colorAttribute?.setXYZ(id, color.r, color.g, color.b);
      });
      // @ts-ignore
      colorAttribute.needsUpdate = true;
    }
  
    private normalizeString(str: string): string {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
  
    private selectDreamContext(dreamReport: string, searchTerm: string, contextLength: number): string {
      const words = dreamReport.split(' ');
      if (searchTerm === '') return words.slice(0, 25).join(' ') + '...';
  
      const index = words.findIndex((word) => word.toLowerCase() === searchTerm.toLowerCase());
      if (index === -1) {
        return words.slice(0, 25).join(' ') + '...';
      }
  
      const startIndex = Math.max(0, index - contextLength);
      const endIndex = Math.min(words.length, index + contextLength + 1);
      return words.slice(startIndex, endIndex).join(' ');
    }

    updateDreamTextsOpacity(){
      this.dreamTexts.forEach((t: TroikaText, i: number) => {
        t.textMesh.fillOpacity = 0
        t.textMesh.outlineOpacity = 0
        let opacity = (i == 0) ? 1 : 0.15;
        gsap.to(t.textMesh, { outlineOpacity: 1, ease: "expo.in", duration: 3.5 })
        gsap.to(t.textMesh, { fillOpacity: opacity, ease: "expo.in", duration: 3.5 })

    });
    }
  }
  
