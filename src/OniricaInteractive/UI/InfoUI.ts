import './info.scss'
import Keyboard from 'simple-keyboard';
import 'simple-keyboard/build/css/index.css';

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
        <div class='cross-icon'>
        <svg id="crossIcon" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 384 512">
          <rect x="165" y="11" width="54" height="490" transform="translate(146.7 572.8) rotate(-135)"  fill="currentColor" stroke="currentColor" />
          <rect x="165" y="11" width="54" height="490" transform="translate(508.8 301.3) rotate(135)"  fill="currentColor" stroke="currentColor"/>
        </svg>
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

    // Creazione del div per i pulsanti
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');

    // Creazione dei pulsanti

    this.keyboard = new Keyboard({
      theme: "hg-theme-default blackTheme",
      layout: {
        default: [
          "1 2 3 4 5 6 7 8 9 0 {bksp}",
          "q w e r t y u i o p",
          "{lock} a s d f g h j k l {enter}",
          "{shift} z x c v b n m {space}",
        ],
        shift: [
          "! @ # $ % ^ & * ( ) _ + {bksp}",
          "{tab} Q W E R T Y U I O P { } |",
          '{lock} A S D F G H J K L : " {enter}',
          "{shift} Z X C V B N M < > ? {shift}",
          ".com @ {space}"
        ]
      },
      display:
      {
        "{bksp}": "del",
        "{enter}": "search",
        "{space}": "space",
        "{lock}": "caps",
        "{shift}": "shift"
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
