export default function isEmptyIterable(iterable: Iterable<unknown>): iterable is Iterable<never> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of iterable) {
        return false;
    }

    return true;
}