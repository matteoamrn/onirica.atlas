import './info.scss'

export type InfoConfig = {
  twitter?: string
  github?: string
  description?: string
  title?: string
  documentTitle?: string
}

export class InfoUI {
  constructor(config: InfoConfig = {}) {
    if (config.documentTitle) {
      document.title = config.documentTitle
    }

    const container = document.createElement('div')
    container.classList.add('info-container')
    container.insertAdjacentHTML(
      'beforeend',
      `
${config.title ? `<h1>${config.title}</h1>` : ''}
${
  config.description
    ? `<div class="description">
  <p>${config.description}</p>
 </div>`
    : ``
}

</div>
    `
    )
    document.body.prepend(container)
  }
}
