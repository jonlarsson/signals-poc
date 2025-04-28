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

function output(vardeSignal: Signal<string>): Element {
	let outputElement = document.createElement('div');
	consume(() => {
		outputElement.innerHTML = vardeSignal();
	}, 'output');
	return outputElement;
}

function raknaTecken(raknaTeckenSignal: WritableSignal<boolean>): Element {
	const checkboxTeckenLabel = document.createElement('label');
	const checkboxTecken = document.createElement('input');
	checkboxTecken.setAttribute('type', 'checkbox');
	checkboxTecken.setAttribute('name', 'raknaTecken');
	checkboxTecken.setAttribute('value', 'tecken');
	checkboxTecken.checked = raknaTeckenSignal();
	checkboxTeckenLabel.append(checkboxTecken, document.createTextNode('Räkna tecken'));
	checkboxTecken.addEventListener('change', () => {
		raknaTeckenSignal.set(checkboxTecken.checked);
	});
	return checkboxTeckenLabel;
}

function antal(antalSignal: Signal<number>): Element {
	let antalElement = document.createElement('div');
	const labelElement = document.createTextNode('Antal: ')
	const countElement = document.createElement('span');
	antalElement.append(labelElement, countElement);
	consume(() => {
		countElement.innerHTML = antalSignal() + '';
	}, 'antal');
	return antalElement;
}

function main(): Element {
	let mainElement = document.createElement('div');

	const vardeSignal = signal('');
	const raknaTeckenSignal = signal<boolean>(true);
	const antalSignal = computed(() => {
		if (raknaTeckenSignal()) {
			return vardeSignal().length;
		}
		return 0;
	});
	mainElement.append(input(vardeSignal));
	mainElement.append(output(vardeSignal));
	mainElement.append(raknaTecken(raknaTeckenSignal))
	mainElement.append(antal(antalSignal));
	return mainElement;
}


document.body.append(main())