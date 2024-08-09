import './sheet.scss'
import gsap from 'gsap'

export type TextConfig = {
  title?: string
  report?: string
  documentTitle?: string
}

export class Sheet {
    public isOriginal: boolean = true
    container: HTMLDivElement

  constructor() {

      this.container = document.createElement('div');
      this.container.classList.add('main');
      this.container.insertAdjacentHTML(
        'beforeend',
        `
        <div id="dreamCard" class="dream-card">
            <i id="card-exit" class="fas fa-times" ></i>

            <h1>Dream no. 748 | NotREM (ST4: deep sleep)</h1>
            <div class="content unselectable">
            <p>I had to prepare the car, I needed to put suitcases in it, some luggage, they were suitcases, some packages, everything was quite confusing. It was me, and there were two of my friends (who took an exam with me today). These packages had the shape of human body organs. It was a road near a pine forest. We didn't talk, just loaded these strange packages.
            I had to prepare the car, I needed to put suitcases in it, some luggage, they were suitcases, some packages, everything was quite confusing. It was me, and there were two of my friends (who took an exam with me today). These packages had the shape of human body organs. It was a road near a pine forest. We didn't talk, just loaded these strange packages.I had to prepare the car, I needed to put suitcases in it, some luggage, they were suitcases, some packages, everything was quite confusing. It was me, and there were two of my friends (who took an exam with me today). These packages had the shape of human body organs. It was a road near a pine forest. We didn't talk, just loaded these strange packages.I had to prepare the car, I needed to put suitcases in it, some luggage, they were suitcases, some packages, everything was quite confusing. It was me, and there were two of my friends (who took an exam with me today). These packages had the shape of human body organs. It was a road near a pine forest. We didn't talk, just loaded these strange packages.I had to prepare the car, I needed to put suitcases in it, some luggage, they were suitcases, some packages, everything was quite confusing. It was me, and there were two of my friends (who took an exam with me today). These packages had the shape of human body organs. It was a road near a pine forest. We didn't talk, just loaded these strange packages.I had to prepare the car, I needed to put suitcases in it, some luggage, they were suitcases, some packages, everything was quite confusing. It was me, and there were two of my friends (who took an exam with me today). These packages had the shape of human body organs. It was a road near a pine forest. We didn't talk, just loaded these strange packages.I had to prepare the car, I needed to put suitcases in it, some luggage, they were suitcases, some packages, everything was quite confusing. It was me, and there were two of my friends (who took an exam with me today). These packages had the shape of human body organs. It was a road near a pine forest. We didn't talk, just loaded these strange packages.I had to prepare the car, I needed to put suitcases in it, some luggage, they were suitcases, some packages, everything was quite confusing. It was me, and there were two of my friends (who took an exam with me today). These packages had the shape of human body organs. It was a road near a pine forest. We didn't talk, just loaded these strange packages.I had to prepare the car, I needed to put suitcases in it, some luggage, they were suitcases, some packages, everything was quite confusing. It was me, and there were two of my friends (who took an exam with me today). These packages had the shape of human body organs. It was a road near a pine forest. We didn't talk, just loaded these strange packages.
            </p>
            </div>
            </div>

    </div>
   `)
   this.container.style.pointerEvents = 'none';
   document.body.prepend(this.container)

document.getElementById("card-exit")?.addEventListener('click', (ev: MouseEvent) => {
    this.container.querySelector('p')?.classList.remove('clickable')

    gsap.to(this.container, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.inOut"
    });
});
}

update(){
}

updateText(text: string, dreamId: number){
    this.container.querySelector('h1')!.textContent = "Dream no. " + String(dreamId);

    this.container.querySelector('p')!.textContent = text;
    this.container.querySelector('p')?.classList.add('clickable')
}

}
