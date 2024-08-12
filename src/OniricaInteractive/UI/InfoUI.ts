import './info.scss'
import Keyboard from 'simple-keyboard';
import 'simple-keyboard/build/css/index.css';
import layout from "simple-keyboard-layouts/build/layouts/spanish";

export type TextConfig = {
  title?: string
  report?: string
  documentTitle?: string
}

export class InfoUI {
  private container!: HTMLDivElement;
  private keyboard: Keyboard

  constructor(config: TextConfig = {}) {
    if (config.documentTitle) {
      document.title = config.documentTitle;
    }

    this.container = document.createElement('div');
    this.container.classList.add("infoBox")
    let homeIcon = document.createElement('div');
    homeIcon.id = 'homeIcon'
    homeIcon.classList.add('home-icon')
    homeIcon.innerHTML = 
    ` <i class="fas fa-home"></i></div>`
  
    this.container.appendChild(homeIcon)

    const searchbar = document.createElement('div')
    searchbar.classList.add('searchBar');
    searchbar.insertAdjacentHTML(
      'beforeend',
      `
        <div id="searchIcon" class='search-icon'>
          <i class="fa-solid fa-magnifying-glass"></i>
        </div>
        <input id="userInput" class="input" inputmode='none' role="presentation" autocomplete="off" >
        <div id="crossIcon" class='cross-icon'>
          <i class="fa-solid fa-x"></i>
        </div>
      `
    );

    this.container.appendChild(searchbar)

    const infobar = document.createElement('div');
    infobar.id = 'infoBar';
    infobar.insertAdjacentHTML(
      'beforeend',
      `
        <div id="dreamCount" class="hidden">
        </div>
      `)
    this.container.appendChild(infobar)

    document.body.prepend(this.container);

    //keyboard
    const key = document.createElement('div')
    key.classList.add("keyboardContainer", "hidden")
    key.id = "keyboardContainer"
    key.innerHTML = 
    `<div class="simple-keyboard"></div>`
   document.body.appendChild(key)

    // Creazione della div per i pulsanti
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');

    // Creazione dei pulsanti
    const buttonPrevious = document.createElement('button');
    buttonPrevious.id = 'button-previous';
    buttonPrevious.classList.add('button-prev', 'btn', 'hidden');
    buttonPrevious.textContent = '<';

    const buttonNext = document.createElement('button');
    buttonNext.id = 'button-next';
    buttonNext.classList.add('button-next', 'btn', 'hidden');
    buttonNext.textContent = '>';

    document.body.appendChild(buttonPrevious);
    document.body.appendChild(buttonNext);

    this.keyboard = new Keyboard({
      theme: "hg-theme-default blackTheme",
      ...layout,
      excludeFromLayout: {
        default: ["@", ".com"],
        shift: ["@", ".com"]
      },
      onChange: input => {
        const inputElement = document.getElementById("userInput") as HTMLInputElement;
        inputElement.value = input

      },
      onKeyPress: button => {
        if (button === "{shift}" || button === "{lock}") {
          let currentLayout = this.keyboard.options.layoutName;
          let shiftToggle = currentLayout === "default" ? "shift" : "default";

          this.keyboard.setOptions({
            layoutName: shiftToggle
          });
        }
        if (button === "{enter}") {
          document.getElementById('searchIcon')?.click()
        }

      }
    });

      const userInput = document.getElementById('userInput');
      const keyboard = document.getElementById('keyboardContainer');

      function showKeyboard() {
        keyboard?.classList.remove("hidden");
      }

      function hideKeyboard() {
        keyboard!.classList.add('hidden');
      }

      userInput!.addEventListener('focus', showKeyboard);

      document.addEventListener('click',  (event:any) => {
        if (!keyboard!.contains(event.target) && event.target !== userInput) {
          hideKeyboard();
        } 

      });



  }

  updateReportText(newText: string, dreamId: string) {
    const reportTextElement = this.container.querySelector('.scrollable-text') as HTMLTextAreaElement;
    if (reportTextElement) {
      reportTextElement.value = 'Dream #' + dreamId + '\n' + '\n' + '\n' + '(' + '\n' + '\n' + newText + '\n' + '\n' + ')';
    }
  }

  updateDreamCounter(ndreams: string) {
    const text = document.getElementById("dreamCount");

    if (ndreams == "-1") {
      text!.textContent = '';
      text!.removeAttribute('data-last-word')
      return
    }
    else if (ndreams == "0") {
      const userInput = document.getElementById('userInput') as HTMLInputElement;
      const lastWord = userInput.value;
      var s =  'No dreams found talking about '
      text!.textContent = s;

      text!.setAttribute('data-last-word', lastWord);
      return
    }
    const userInput = document.getElementById('userInput') as HTMLInputElement;
    const lastWord = userInput.value;
    var s =  ndreams + ' dreams are talking about '
    text!.textContent = s;
    text!.setAttribute('data-last-word', lastWord);
  }

  resetKeyboard() {
    this.keyboard!.clearInput()
    this.hideButtons()
  }

  showButtons() {
    const buttonPrevious = document.getElementById('button-previous');
    buttonPrevious?.classList.remove('hidden');
    const buttonNext = document.getElementById('button-next');
    buttonNext?.classList.remove('hidden');
    const infoBar = document.getElementById('dreamCount');
    infoBar?.classList.remove('hidden');

  }

  hideButtons() {
    const buttonPrevious = document.getElementById('button-previous');
    buttonPrevious?.classList.add('hidden');
    const buttonNext = document.getElementById('button-next');
    buttonNext?.classList.add('hidden');
    const infoBar = document.getElementById('dreamCount');
    infoBar?.classList.add('hidden');

  }


}
