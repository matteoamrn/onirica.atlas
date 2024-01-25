import './text.scss'

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
        ${config.title ? `<h1>${config.title}</h1>` : ''}
        ${
          config.report
            ? `<div class="report">
                <p>${config.report}</p>
             </div>`
            : ``
        }
        <textarea class="scrollable-text" disabled="true"></textarea>
        <div class="input-prompt">
          <label for="userInput">Input:</label>
          <input type="text" id="userInput" name="userInput">
        </div>      `
    );
    document.body.prepend(this.container);
  }

  updateReportText(newText: string) {
    const reportTextElement = this.container.querySelector('.scrollable-text') as HTMLTextAreaElement;
    if (reportTextElement) {
      reportTextElement.value = newText;
    }
  }

}
