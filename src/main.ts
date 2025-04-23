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
    });
    return outputElement;
}

function antalTecken(antalSignal: Signal<number>): Element {
    let antalTeckenElement = document.createElement('div');
    const labelElement = document.createTextNode('Antal tecken: ')
    const countElement = document.createElement('span');
    antalTeckenElement.append(labelElement, countElement);
    consume(() => {
        countElement.innerHTML = antalSignal() + '';
    });
    return antalTeckenElement;
}

function main(): Element {
    let mainElement = document.createElement('div');

    const vardeSignal = signal('');
    const antalTeckenSignal = computed(() => {
        return vardeSignal().length;
    })
    mainElement.append(input(vardeSignal));
    mainElement.append(output(vardeSignal));
    mainElement.append(antalTecken(antalTeckenSignal));
    return mainElement;
}


document.body.append(main())