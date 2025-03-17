import gsap from 'gsap'

export type TextConfig = {
	title?: string
	report?: string
	documentTitle?: string
}

export class Sheet {
	public isOriginal: boolean = true
	container: HTMLDivElement
	svg: SVGElement
	line1: SVGLineElement
	line2: SVGLineElement

	constructor() {
		this.container = document.createElement('div')
		this.container.classList.add('w-full', 'h-full', 'absolute', 'flex', 'justify-center', 'items-center', 'opacity-0', 'pointer-events-none')
		this.container.insertAdjacentHTML(
			'beforeend',
			`
		<div class="flex justify-center items-center absolute top-[12.5%]">
			<div id="button-previous" class="hidden relative border-none text-gray-400 font-light p-2.5 cursor-pointer pointer-events-auto top-1/2 transform translate-y-1/2 z-10 w-5 h-5"> 
				<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 512 512">
					<polygon class="st0" points="89.3 257 449.9 48.8 449.9 465.2 89.3 257"/>
				</svg>   
			</div>
			<div id="dreamCard" class="relative bg-black bg-opacity-95 p-5 m-3.5 border border-white w-[60vh] h-[60vh] text-white font-mono box-border overflow-hidden">
				<div id="card-exit" class="absolute right-[2.5%] mr-[2.5%] mb-[2.5%] mt-[2.5%] cursor-pointer pointer-events-auto text-white flex justify-center items-center w-5 h-5">
					<svg viewBox="0 0 384 512">
						<rect class='rect' x="165" y="11" width="54" height="490" transform="translate(146.7 572.8) rotate(-135)"/>
						<rect class='rect' x="165" y="11" width="54" height="490" transform="translate(508.8 301.3) rotate(135)"/>
					</svg>		
				</div>
				<div id="card-header" class="flex justify-start items-center ml-[2.5%] mb-[2.5%] mt-[2.5%]">
					<h1 class="text-[1.2rem] font-bold text-black bg-white inline-block leading-[1.2] md:text-[1rem] sm:text-[0.8rem]">Dream no. 748 | NotREM (ST4: deep sleep)</h1> 
					<h2 class="text-[1.2rem] font-thin text-gray-400 md:text-[1.1rem] sm:text-[0.8rem]">Dreambank: Bo</h2>
				</div>
				<div class="content unselectable h-[80%] overflow-y-auto p-3">
					<p class="text-[0.8rem] leading-[1.6] font-thin text-gray-400 md:text-[0.9rem] sm:text-[0.6rem]">I had to prepare the car, I needed to put suitcases in it, some luggage, they were suitcases, some packages, everything was quite confusing. It was me, and there were two of my friends (who took an exam with me today). These packages had the shape of human body organs. It was a road near a pine forest. We didn't talk, just loaded these strange packages.</p>
				</div>
			</div>
			<div id="button-next" class="button-prev side-btn hidden"> 
				<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 512 512">
					<polygon class="st0" points="48.8 48.8 409.4 257 48.8 465.2 48.8 48.8" fill="currentColor"/>
				</svg>
			</div>
		</div>
   `)
		/*
				<div id="imageCard" class="image-card">
		<img src="test.png"></div>

		*/

   
		this.container.style.pointerEvents = 'none'
		document.body.prepend(this.container)
		/*
		Create SVG and lines
		this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		this.svg.id = 'lineSVG';
		this.line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
		this.line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");

		this.svg.style.opacity = "0%";
		this.svg.appendChild(this.line1);
		this.svg.appendChild(this.line2);
		document.body.prepend(this.svg);

		const rect = document.getElementById("dreamCard")?.getBoundingClientRect();
		const rect2 = document.getElementById("imageCard")?.getBoundingClientRect();

		if (rect && rect2) {
			var x1 = rect.right;
			var y1 = rect.top;
			var x2 = rect2.left;
			var y2 = rect2.top;

			this.line1.setAttribute("x1", x1.toString());
			this.line1.setAttribute("y1", y1.toString());
			this.line1.setAttribute("x2", x2.toString());
			this.line1.setAttribute("y2", y2.toString());

			y1 = rect.bottom;
			y2 = rect2.bottom;
			this.line2.setAttribute("x1", x1.toString());
			this.line2.setAttribute("y1", y1.toString());
			this.line2.setAttribute("x2", x2.toString());
			this.line2.setAttribute("y2", y2.toString());
		}*/


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
		// opacity: 0,
		// duration: 0.5,
		// ease: "power2.inOut"
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
