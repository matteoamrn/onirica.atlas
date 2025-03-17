import './style.css'
import { Engine } from './engine/Engine'
import { OniricaInteractive } from './OniricaInteractive/OniricaInteractive'

new Engine({
  canvas: document.querySelector('#canvas') as HTMLCanvasElement,
  experience: OniricaInteractive,
  info: {
    documentTitle: 'Onirica().web',
    title: 'Onirica().web',
    description: 'by fuse*',
    website: "https://www.fuseworks.it/"
  },
})
