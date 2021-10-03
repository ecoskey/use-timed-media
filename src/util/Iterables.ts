export function isEmptyIterable(iterable: Iterable<unknown>): iterable is Iterable<never> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of iterable) {
        return false;
    }

    return true;
}

export function getIterableFirst<E>(iterable: Iterable<E>): E | undefined {
    for (const element of iterable) {
        return element;
    }
    
    return undefined;
}