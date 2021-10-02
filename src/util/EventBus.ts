type CallbackFromTuple<T extends readonly unknown[]> = (...params: T) => void

export default class EventBus<E extends Record<string, readonly unknown[]>> {
    #maxKey: number
    #listeners: {
        [K in keyof E]+?: Map<number, CallbackFromTuple<E[K]>>;
    };

    constructor() {
        this.#maxKey = 0;
        this.#listeners = {};
    }

    on<K extends keyof E>(event: K, callback: CallbackFromTuple<E[K]>): number {
        const targetHandlerList = this.#listeners?.[event];

        if (targetHandlerList) {
            this.#maxKey++;
            targetHandlerList.set(this.#maxKey, callback);
        } else {
            this.#maxKey++;
            this.#listeners[event] = new Map<number, CallbackFromTuple<E[K]>>([[this.#maxKey, callback]]);
        }

        return this.#maxKey;
    }

    dispatch<K extends keyof E>(event: K, ...data: E[K]): void {
        const targetHandlerList = this.#listeners?.[event];

        targetHandlerList?.forEach(callback => {
            callback(...data);
        });
    }

    unsubscribe<K extends keyof E>(event: K, target: number): void {
        const targetHandlerList = this.#listeners?.[event];

        targetHandlerList?.delete(target);
    }

    clear(): void {
        this.#maxKey = 0;
        this.#listeners = {};
    }
}