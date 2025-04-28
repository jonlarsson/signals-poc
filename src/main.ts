import {computed, consume, Signal, signal, WritableSignal} from "./signals";


function input(vardeSignal: WritableSignal<string>): HTMLInputElement {
	const inputElement = document.createElement('input');
	inputElement.addEventListener('input', event => {
		if (event.target instanceof HTMLInputElement) {
			vardeSignal.set(event.target.value)
		}
	})
	return inputElement;
}

function output(visaVardeSignal: Signal<boolean>, vardeSignal: Signal<string>): Element {
	let outputElement = document.createElement('div');
	const text = document.createTextNode('');
	outputElement.append(text);
	consume(() => {
		if (visaVardeSignal()) {
			text.data = 'Värde: ' + vardeSignal();
		} else {
			text.data = ''
		}
	}, 'consume: VisningVarde');
	return outputElement;
}

function checkbox(checkedSignal: WritableSignal<boolean>, name: string, label: string): Element {
	const checkboxLabel = document.createElement('label');
	const checkbox = document.createElement('input');
	checkbox.setAttribute('type', 'checkbox');
	checkbox.setAttribute('name', name);
	checkbox.setAttribute('value', 'true');
	checkbox.checked = checkedSignal();
	checkboxLabel.append(checkbox, document.createTextNode(label));
	checkbox.addEventListener('change', () => {
		checkedSignal.set(checkbox.checked);
	});
	let div = document.createElement('div');
	div.append(checkboxLabel);
	return div;
}

function antal(antalSignal: Signal<number>): Element {
	let antalElement = document.createElement('div');
	const labelElement = document.createTextNode('Antal: ')
	const countElement = document.createElement('span');
	antalElement.append(labelElement, countElement);
	consume(() => {
		countElement.innerHTML = antalSignal() + '';
	}, 'consume: VisningAntalTecken');
	return antalElement;
}

function main(): Element {
	let mainElement = document.createElement('div');

	const visaVardeSignal = signal(true, 'visaVardeSignal');
	const vardeSignal = signal('', 'vardeSignal');
	const raknaTeckenSignal = signal<boolean>(true, 'raknaTeckenSignal');
	const antalSignal = computed(() => {
		if (raknaTeckenSignal()) {
			return vardeSignal().length;
		}
		return 0;
	}, 'computed: AntalTecken');
	mainElement.append(input(vardeSignal));
	mainElement.append(checkbox(visaVardeSignal, 'visaVarde','Visa värde'))
	mainElement.append(output(visaVardeSignal, vardeSignal));
	mainElement.append(checkbox(raknaTeckenSignal, 'raknaTecken', 'Räkna tecken'))
	mainElement.append(antal(antalSignal));
	return mainElement;
}


document.body.append(main())