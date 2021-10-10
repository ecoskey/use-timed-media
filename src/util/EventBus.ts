export default class EventBus<E extends Record<string, readonly unknown[]>> {
    #maxKey: number
    #listeners: {
        [K in keyof E]+?: Map<number, (...params: E[K]) => void>;
    };

    constructor() {
        this.#maxKey = 0;
        this.#listeners = {};
    }

    on<K extends keyof E>(event: K, callback: (...params: E[K]) => void): number {
        const targetHandlerList: Map<number, (...params: E[K]) => void> | undefined = this.#listeners[event];

        if (targetHandlerList) {
            targetHandlerList.set(this.#maxKey, callback);
        } else {
            this.#listeners[event] = new Map<number, (...params: E[K]) => void>([[this.#maxKey, callback]]);
        }

        return this.#maxKey++;
    }

    dispatch<K extends keyof E>(event: K, data: E[K]): void {
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