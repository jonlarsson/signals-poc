# Signals POC

En enkel signal-implementation för att lättare
förstå den fullfjädrade i angular. 

* src/main.ts bygger upp en applikation
* src/signals.ts utgör signals-biblioteket som applikationen använder för få reda på när vyerna ska uppdateras.

Implementationen är förenklad, t.ex. saknas sådant som:

* Felhantering
* Skydd mot cirkulära beroenden
* coalescing för att kunna göra flera uppdateringar av en vy i ett och samma steg

Starta dev: 

```bash
npm install
npm run dev
```

## Signaler

### signal<T>(...): WritableSignal<T>

Varje gång någon Consumer läser signalen bokförs det i signalens Producer-nod. Samtidigt sparas Producer-noden som ett beroende
i Consumer-noden.


### computed<T>(compute: () => T): Signal<T>

En computed-signal är både en Consumer av andra signaler och en Producer av det beräknade resultatet. Varje gång compute-funktionen körs
kan dess beroenden ha ändrats, och oanvända beroenden måste rensas bort.

### En graf av Producer- och Consumer-noder

Genom att varje Consumer-nod registrerar sig som activeConsumer byggs en graf upp av noder som antingen är av typen:

* Consumer, t.ex. vyer och effekter
* Producer, t.ex. signal
* Consumer och Producer, t.ex. computed
