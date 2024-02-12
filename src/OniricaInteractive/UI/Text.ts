import './text.scss'

export type TextConfig = {
  title?: string
  report?:string
  documentTitle?: string
}

export class TextUI {
  private container!: HTMLDivElement;
  private nDreams:number = 0;

  constructor(config: TextConfig = {}) {
    if (config.documentTitle) {
      document.title = config.documentTitle;
    }

    this.container = document.createElement('div');
    this.container.classList.add('text-container');
    this.container.insertAdjacentHTML(
      'beforeend',
      `
        ${config.title ? `<h1>${config.title}</h1>` : ''}
        ${
          config.report
            ? `<div class="report">
                <p>${config.report}</p>
             </div>`
            : ``
        }
        
        <div class="input-prompt">
          <label for="userInput">Search dreams containing the word:</label>
          <input type="text" id="userInput" name="userInput"> </input> 
          <button id="button-search">search</button>
        </div>
          <div id="dreamCount"> </div>
        <textarea class="scrollable-text" disabled="true"> </textarea>
        <div id="topics"> Explore other dreams about: </div>
        <div class="button-container">
          <button id="button-topic1" class="button-topic">Hamsters</button>
          <button id="button-topic2" class="button-topic">Cake</button>
          <button id="button-topic3" class="button-topic">Sleep</button>
        </div>
        `
        //<div class="separatorUp"></div> 
        
        //<div class="separatorDown"></div>  
    );
    document.body.prepend(this.container);

    // Create the button container and buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-other-dreams');

    const buttonPrevious = document.createElement('button');
    buttonPrevious.id = 'button-previous';
    buttonPrevious.classList.add('button-others');
    buttonPrevious.textContent = 'Previous dream';

    const buttonNext = document.createElement('button');
    buttonNext.id = 'button-next';
    buttonNext.classList.add('button-others');
    buttonNext.textContent = 'Next dream';

    buttonContainer.appendChild(buttonPrevious);
    buttonContainer.appendChild(buttonNext);

    document.body.appendChild(buttonContainer);
  }

  updateReportText(newText: string, dreamId:string) {
    const reportTextElement = this.container.querySelector('.scrollable-text') as HTMLTextAreaElement;
    if (reportTextElement) {
      reportTextElement.value = 'Dream #' + dreamId + '\n' + '\n' + '\n' + '(' + '\n' + '\n' + newText + '\n' + '\n' + ')';
    }
  }
  
  updateDreamCounter(ndreams: string) {
    const text = this.container.querySelector('#dreamCount');
    const userInput = document.getElementById('userInput') as HTMLInputElement;
    const lastWord = userInput.value;
    text!.textContent = ndreams + ' dreams are talking about ';
    text!.setAttribute('data-last-word', lastWord);
  }

  // updateRelatedTopics(topics: string){


  // }

  // updateSearchedWord() {
  //   const text = this.container.querySelector('#dreamCount');
  //   const field = document.getElementById('userInput') as HTMLInputElement;

  //   text!.textContent = field.value; 
  // }


  



}
