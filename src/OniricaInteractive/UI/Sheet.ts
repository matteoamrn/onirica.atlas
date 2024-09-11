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
	// svg: SVGElement
	// line1: SVGLineElement
	// line2: SVGLineElement

	constructor() {
		this.container = document.createElement('div')
		this.container.classList.add('main')
		this.container.insertAdjacentHTML(
			'beforeend',
			`
        <div id="dreamCard" class="dream-card">
            <i id="card-exit" class="fas fa-times" ></i>
			<div id="card-header" class="card-header">
			<h1>Dream no. 748 | NotREM (ST4: deep sleep)</h1> 
			<h2>Dreambank: Bo</h2>
			</div>
            <div class="content unselectable">
            <p>I had to prepare the car, I needed to put suitcases in it, some luggage, they were suitcases, some packages, everything was quite confusing. It was me, and there were two of my friends (who took an exam with me today). These packages had the shape of human body organs. It was a road near a pine forest. We didn't talk, just loaded these strange packages.</p>
            </div>
        </div>
   `)/*
   		<div id="imageCard" class="image-card">
		</div>

   */
		this.container.style.pointerEvents = 'none'
		document.body.prepend(this.container)

		//    // Create SVG and lines
		//    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
		//    this.svg.id = 'lineSVG'
		//    this.line1 = document.createElementNS("http://www.w3.org/2000/svg", "line")
		//    this.line2 = document.createElementNS("http://www.w3.org/2000/svg", "line")

		//    this.svg.style.opacity = "0";
		//    this.svg.appendChild(this.line1)
		//    this.svg.appendChild(this.line2)
		//    document.body.prepend(this.svg)

		//    const rect = document.getElementById("dreamCard")?.getBoundingClientRect()
		//    const rect2 = document.getElementById("imageCard")?.getBoundingClientRect()

		//    if (rect && rect2){
		//     var x1 = rect.right
		//     var y1 = rect.top
		//     var x2 = rect2.left + rect2.width*0.5
		//     var y2 = rect2.top


		//     this.line1.setAttribute("x1", x1.toString())
		//     this.line1.setAttribute("y1", y1.toString())
		//     this.line1.setAttribute("x2", x2.toString())
		//     this.line1.setAttribute("y2", y2.toString())

		//     y1 = rect.bottom
		//     y2 = rect2.bottom
		//     this.line2.setAttribute("x1", x1.toString())
		//     this.line2.setAttribute("y1", y1.toString())
		//     this.line2.setAttribute("x2", x2.toString())
		//     this.line2.setAttribute("y2", y2.toString())
		//    }


		document.getElementById("card-exit")?.addEventListener('click', () => {
			this.hide()
		})
	}
	hide() {
		this.container.querySelector('p')?.classList.remove('clickable')

		gsap.to(this.container, {
			opacity: 0,
			duration: 0.5,
			ease: "power2.inOut"
		})
		// gsap.to(this.svg, {
		// 	opacity: 0,
		// 	duration: 0.5,
		// 	ease: "power2.inOut"
		// })

	}



	update() {

	}


	updateText(text: string, dreamId: number, dreambank:string, highlightWord?: string) {
		this.container.querySelector('h1')!.textContent = "Dream no. " + String(dreamId);
		const dreambank_string = dreambank == 'Bo' ? 'University of Bologna' : 'UC Santa Cruz'  
		this.container.querySelector('h2')!.textContent = "Dreambank: " + dreambank_string;

		const paragraph = this.container.querySelector('p')!;

		if (highlightWord) {
			highlightWord = highlightWord.replace(/[-\/\\^$*+?.()|[\]{},]/g, '');
			const words = text.split(' ');
			text = words.map(word => {
				const cleanword = word.replace(/[-\/\\^$*+?.()|[\]{},]/g, '')
				if (cleanword.toLowerCase() === highlightWord!.toLowerCase()) {
					return `<span class="highlight">${word}</span>`;
				}
				return word;
			}).join(' ');
		}

		paragraph.innerHTML = text;

		paragraph.classList.add('clickable');
	}
}
