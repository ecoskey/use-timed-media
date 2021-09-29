import AVLNode from './AVLNode';
import { KVP } from '../util/KeyValuePair';

export type IteratorDirection = 'ascending' | 'descending';

export default class AVLIterator<K, V> implements IterableIterator<KVP<K, V[]>> {
    readonly #direction: IteratorDirection;
    #current?: AVLNode<K, V>;
    #returnedFirst: boolean;
    
    constructor (direction: IteratorDirection, startingNode?: AVLNode<K, V>) {
        this.#direction = direction;
        this.#current = startingNode;
        this.#returnedFirst = false;
    }

    get current(): IteratorResult<KVP<K, V[]>, undefined> {
        if (this.#current) {
            return {
                value: this.#current.kvp,
                done: false,
            };
        } else {
            return {
                value: undefined,
                done: true,
            };
        }
    }

    get direction(): IteratorDirection {
        return this.#direction;
    }

    isPopulated(): this is Required<AVLIterator<K, V>> {
        return this.#current !== undefined;
    }

    hasNext(): boolean {
        if (!this.#returnedFirst) {
            return this.#current !== undefined;
        }

        switch (this.#direction) {
            case 'ascending': {
                return this.#current?.successor !== undefined;
            }
            case 'descending': {
                return this.#current?.predecessor !== undefined;
            }
        }
    }
    
    next(): IteratorResult<KVP<K, V[]>, undefined> {
        if (!this.#current) {
            return {
                value: undefined,
                done: true,
            };
        }
        
        if (!this.#returnedFirst) {
            this.#returnedFirst = true;
            return {
                value: this.#current.kvp,
                done: false,
            };
        }

        switch (this.#direction) {
            case 'ascending': {
                const successor: AVLNode<K, V> | undefined = this.#current.successor;
                if (successor) {
                    this.#current = successor;
                    return {
                        value: successor.kvp,
                        done: false,
                    };
                } else {
                    return {
                        value: undefined,
                        done: true,
                    };
                }
            }
            case 'descending': {
                const predecessor: AVLNode<K, V> | undefined = this.#current.predecessor;
                if (predecessor) {
                    this.#current = predecessor;
                    return {
                        value: predecessor.kvp,
                        done: false,
                    };
                } else {
                    return {
                        value: undefined,
                        done: true,
                    };
                }
            }
        }
    }

    [Symbol.iterator](): this {
        return this;
    }
}