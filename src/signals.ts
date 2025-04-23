export interface Signal<T> {
    (): T
}

export interface WritableSignal<T> extends Signal<T> {
    set: (value: T) => void
}

export interface Consumer {
    valueUpdated: () => void;
}

let activeConsumer: Consumer | null = null;

export function consume(handler: () => void) {
    const consumer: Consumer = {
        valueUpdated: () => {
            handler();
        }
    };
    const previousConsumer = activeConsumer;
    activeConsumer = consumer;
    handler();
    activeConsumer = previousConsumer;
}

function valueUpdated(consumers: Consumer[]) {
    for (const consumer of consumers) {
        consumer.valueUpdated();
    }
}

function signalConsumed(currentConsumers: Consumer[]) {
    if (activeConsumer && !currentConsumers.includes(activeConsumer)) {
        currentConsumers.push(activeConsumer);
    }
}

export function signal<T>(initial: T): WritableSignal<T> {
    let value = initial;
    const consumers: Consumer[] = [];
    const getter = () => {
        signalConsumed(consumers);
        return value;
    }
    const set = (newValue: T) => {
        value = newValue;
        valueUpdated(consumers);
    };
    getter.set = set;
    return getter as WritableSignal<T>;
}

export function computed<T>(compute: () => T): Signal<T> {
    let value: T;
    const consumers: Consumer[] = [];
    consume(() => {
        value = compute();
        for (const consumer of consumers) {
            consumer.valueUpdated();
        }
    });
    return () => {
        signalConsumed(consumers);
        return value;
    };
}