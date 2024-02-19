import './text.scss'
import Keyboard from 'simple-keyboard';
import 'simple-keyboard/build/css/index.css';

export type TextConfig = {
  title?: string
  report?:string
  documentTitle?: string
}

export class TextUI {
  private container!: HTMLDivElement;

  constructor(config: TextConfig = {}) {
    if (config.documentTitle) {
      document.title = config.documentTitle;
    }

    this.container = document.createElement('div');
    this.container.classList.add('text-container');
    this.container.insertAdjacentHTML(
      'beforeend',
      `
      <div class="searchBar">
        <div id ="searchIcon" class='search-icon'>
          <i class="fa-solid fa-magnifying-glass"></i>
        </div>
        <input id="userInput" class="input " />
        <div id="crossIcon" class='cross-icon'>
        <i class="fa-solid fa-x"></i>
      </div>

      </div> 

      <div id="keyboardContainer" class="keyboardContainer hidden">
        <div class="simple-keyboard" ></div>
      </div>              `
    );
    document.body.prepend(this.container);
    const topbar = document.createElement('div');
    topbar.classList.add('infoBar');
    topbar.insertAdjacentHTML(
      'beforeend',
      `
      <div id="dreamCount"> </div> `
    );

    document.body.prepend(topbar)


    // // Create the button container and buttons
    // const buttonContainer = document.createElement('div');
    // buttonContainer.classList.add('button-other-dreams');

    // const buttonPrevious = document.createElement('button');
    // buttonPrevious.id = 'button-previous';
    // buttonPrevious.classList.add('button-others');
    // buttonPrevious.textContent = 'Previous dream';

    // const buttonNext = document.createElement('button');
    // buttonNext.id = 'button-next';
    // buttonNext.classList.add('button-others');
    // buttonNext.textContent = 'Next dream';

    // buttonContainer.appendChild(buttonPrevious);
    // buttonContainer.appendChild(buttonNext);

    // document.body.appendChild(buttonContainer);
      
    const keyboard = new Keyboard({
      onChange: input => onChange(input),
      onKeyPress: pressed => onKeyPress(pressed)
    });
    
    function onChange(input:any){
      (document.querySelector(".input") as any)!.value = input;
    }
    function onKeyPress(button:any) {
      if (button === "{shift}" || button === "{lock}") {
          let currentLayout = keyboard.options.layoutName;
          let shiftToggle = currentLayout === "default" ? "shift" : "default";
        
          keyboard.setOptions({
            layoutName: shiftToggle
          });
      }
      if (button === "{enter}") document.getElementById('searchIcon')?.click()
      

    }
              
    document.getElementById("crossIcon")?.addEventListener('click', () =>{
      const field = document.getElementById('userInput') as HTMLInputElement;
      field.value = ''
      document.getElementById("keyboardContainer")?.classList.add("hidden");
      const search = document.getElementById('searchIcon') as HTMLButtonElement;
      search.click()
    })

    document.getElementById("userInput")!.addEventListener('focus', function() {
      document.getElementById("keyboardContainer")?.classList.remove("hidden");
    });
    document.getElementById("keyboardContainer")!.addEventListener('blur', function() {
      document.getElementById("keyboardContainer")?.classList.add("hidden");
    });

    
  }


  updateReportText(newText: string, dreamId:string) {
    const reportTextElement = this.container.querySelector('.scrollable-text') as HTMLTextAreaElement;
    if (reportTextElement) {
      reportTextElement.value = 'Dream #' + dreamId + '\n' + '\n' + '\n' + '(' + '\n' + '\n' + newText + '\n' + '\n' + ')';
    }
  }
  
  updateDreamCounter(ndreams: string) {
    const text = document.getElementById("dreamCount");

    if (ndreams == "-1")  
    {
      text!.textContent = '';
      text!.removeAttribute('data-last-word')
      return
    }
    const userInput = document.getElementById('userInput') as HTMLInputElement;
    const lastWord = userInput.value;
    text!.textContent = ndreams + ' dreams are talking about ';
    text!.setAttribute('data-last-word', lastWord);
  }


}
