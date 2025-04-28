export interface Signal<T> {
	(): T
}

export interface WritableSignal<T> extends Signal<T> {
	set: (value: T) => void
}

export interface Producer<T = unknown> {
	debugName?: string;
	value: T;
	consumers: Consumer[];
}

export interface Consumer {
	debugName?: string;
	valueUpdated: () => void;
	producers: Producer[];
}

let activeConsumer: Consumer | null = null;
const DEBUG_TOOLS: { rootNodes: Consumer[], printGraph: () => void } = {
	rootNodes: [],
	printGraph: () => {
		const toGraphNode = (node: Consumer | Producer, prefix = ''): void => {
			let name = node.debugName ?? 'unnamned';
			if ('value' in node ) {
				console.log(prefix + name, node.value);
			} else {
				console.log(prefix + name);
			}

			if ('producers' in node) {
				node.producers.forEach(producer => toGraphNode(producer, prefix + '    '));
			}
		};

		DEBUG_TOOLS.rootNodes.forEach(root => toGraphNode(root, ''));
	}
}
// @ts-ignore
window.DEBUG_TOOLS = DEBUG_TOOLS;


function consumeAndHandleStaleProducers<R>(node: Consumer, action: () => R) {
	const prevConsumer: Consumer | null = activeConsumer;
	const prevProducers = node.producers;
	node.producers = [];
	activeConsumer = node;
	try {
		const returnValue: R = action();
		const staleProducers = prevProducers.filter(candidate => !node.producers.includes(candidate));
		for (const staleDep of staleProducers) {
			staleDep.consumers.splice(staleDep.consumers.indexOf(node), 1);
		}
		return returnValue;
	} finally {
		activeConsumer = prevConsumer;
	}

}

export function consume(handler: () => void, debugName?: string) {
	const node: Consumer = {
		debugName,
		valueUpdated: () => {
			consumeAndHandleStaleProducers(node, handler)
		},
		producers: []
	};
	consumeAndHandleStaleProducers(node, handler);
	DEBUG_TOOLS.rootNodes.push(node);
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
	if (activeConsumer && !activeConsumer.producers.includes(producer)) {
		activeConsumer.producers.push(producer);
	}
}

export function signal<T>(initial: T, debugName?: string): WritableSignal<T> {
	const node: Producer = {
		value: initial,
		debugName,
		consumers: []
	}
	const getter = () => {
		signalConsumed(node);
		return node.value;
	}
	getter.set = (newValue: T) => {
		node.value = newValue;
		valueUpdated(node);
	};
	return getter as WritableSignal<T>;
}

const computedValueInit = Symbol('computedValueInit');
type ComputedValueInit = typeof computedValueInit;

export function computed<T>(compute: () => T, debugName?: string): Signal<T> {
	const node: Consumer & Producer<T | ComputedValueInit> = {
		value: computedValueInit,
		debugName,
		valueUpdated: () => {
			// vi behöver räkna om värdet varje gång något beroende ändras
			const computedValue = consumeAndHandleStaleProducers(node, compute);
			if (computedValue !== node.value) {
				node.value = computedValue;
				valueUpdated(node)
			}
		},
		producers: [],
		consumers: []
	};
	return () => {
		if (node.value === computedValueInit) {
			// Om vi aldrig beräknat värdet måste det göras först. Därefter hanteras det vid uppdateringar från beroenden i value updated.
			node.value = consumeAndHandleStaleProducers(node, compute);
		}
		signalConsumed(node);
		return node.value;
	};
}