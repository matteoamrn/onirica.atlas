import './info.scss'
import instagramLogo from '../../../assets/logos/instagram.png'
import siteLogo from '../../../assets/logos/fuse.png'

export type InfoConfig = {
  documentTitle?: string
  title?: string
  description?: string
  instagram?: string
  website?: string

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
<div class="social-container">
${
  config.instagram
    ? `<a href="${config.instagram}" class="social-button" target="_blank"> 
    <img src="${instagramLogo}" alt="Twitter logo linking to profile" />
  </a>`
    : ``
}
${
  config.website
    ? `<a href="${config.website}" class="social-button" target="_blank"> 
    <img src="${siteLogo}" alt="Twitter logo linking to profile" />
  </a>`
    : ``
}

</div>
</div>
    `
    )
    //document.body.prepend(container)
  }
}
