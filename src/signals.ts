export interface Signal<T> {
	(): T
}

export interface WritableSignal<T> extends Signal<T> {
	set: (value: T) => void
}

export interface Producer {
	consumers: Consumer[];
}

export interface Consumer {
	name?: string;
	valueUpdated: () => void;
	dependencies: Producer[];
}

let activeConsumer: Consumer | null = null;

export function consume(handler: () => void, name?: string) {
	const consumer: Consumer = {
		name,
		valueUpdated: () => {
			handler();
		},
		dependencies: []
	};
	const previousConsumer = activeConsumer;
	activeConsumer = consumer;
	try {
		handler();
	} finally {
		activeConsumer = previousConsumer;
	}
}

function valueUpdated({consumers}: Producer) {
	for (const consumer of consumers) {
		consumer.valueUpdated();
	}
}

function signalConsumed(producer: Producer) {
	const currentConsumers = producer.consumers;
	if (activeConsumer && !currentConsumers.includes(activeConsumer)) {
		currentConsumers.push(activeConsumer);
	}
	if (activeConsumer && !activeConsumer.dependencies.includes(producer)) {
		activeConsumer.dependencies.push(producer);
	}
}

export function signal<T>(initial: T): WritableSignal<T> {
	let value = initial;
	const node: Producer = {
		consumers: []
	}
	const getter = () => {
		signalConsumed(node);
		return value;
	}
	getter.set = (newValue: T) => {
		value = newValue;
		valueUpdated(node);
	};
	return getter as WritableSignal<T>;
}

const computedValueInit = Symbol('computedValueInit');
type ComputedValueInit = typeof computedValueInit;
export function computed<T>(compute: () => T): Signal<T> {
	let value: T | ComputedValueInit = computedValueInit;
	const node: Consumer & Producer = {
		name: 'computed',
		valueUpdated: () => {
			// vi behöver räkna om värdet varje gång något beroende ändras
			const computedValue = computeValue();
			if (computedValue !== value) {
				value = computedValue;
				valueUpdated(node)
			}
		},
		dependencies: [],
		consumers: []
	};
	const computeValue = (): T => {
		const prevConsumer: Consumer | null = activeConsumer;
		let computedValue: T | ComputedValueInit = value;
		const prevDependencies = node.dependencies;
		node.dependencies = [];
		activeConsumer = node;
		try {
			computedValue = compute();
		} finally {
			activeConsumer = prevConsumer;
		}
		let staleDeps = prevDependencies.filter(candidate => !node.dependencies.includes(candidate));
		for (const staleDep of staleDeps) {
			staleDep.consumers.splice(staleDep.consumers.indexOf(node), 1);
		}
		return computedValue;
	}
	return () => {
		if (value === computedValueInit) {
			// Om vi aldrig beräknat värdet måste det göras först. Därefter hanteras det vid uppdateringar från beroenden i value updated.
			value = computeValue();
		}
		signalConsumed(node);
		return value;
	};
}