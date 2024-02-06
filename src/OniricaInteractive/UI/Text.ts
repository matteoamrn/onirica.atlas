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
        <div class="separatorUp"></div> 
          <div id="dreamCount"> </div>
          <div class="separatorDown"></div>   
        <textarea class="scrollable-text" disabled="true"> </textarea>`
        
    );
    document.body.prepend(this.container);
  }

  updateReportText(newText: string, dreamId:string) {
    const reportTextElement = this.container.querySelector('.scrollable-text') as HTMLTextAreaElement;
    if (reportTextElement) {
      reportTextElement.value = 'Dream #' + dreamId + '\n' + '\n' + '(' + '\n' + newText + '\n' + ')';
    }
  }
  
  updateDreamCounter(ndreams: string) {
    const text = this.container.querySelector('#dreamCount');
    const userInput = document.getElementById('userInput') as HTMLInputElement;
    const lastWord = userInput.value;
    text!.textContent = ndreams + ' dreams are talking about ';
    text!.setAttribute('data-last-word', lastWord);
  }

  // updateSearchedWord() {
  //   const text = this.container.querySelector('#dreamCount');
  //   const field = document.getElementById('userInput') as HTMLInputElement;

  //   text!.textContent = field.value; 
  // }


  



}
