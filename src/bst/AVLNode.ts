import type { CompareFunc, CompareResult } from '../util/CompareFunc';
import type { KVP } from '../util/KeyValuePair';

export default class AVLNode<K, V> {
    readonly #key: K;
    readonly #values: V[];
    readonly #compareFunc: CompareFunc<K>;

    #parent?: AVLNode<K, V>
    #leftNode?: AVLNode<K, V>; // ! key should always be less than this.#key
    #rightNode?: AVLNode<K, V>; // ! key should always be greater than this.#key  

    constructor(key: K, compareFunc: CompareFunc<K>, initialParent?: AVLNode<K, V>, initialItems?: Iterable<V> | null | undefined) {
        this.#key = key;
        this.#values = [...(initialItems ?? [])];
        this.#compareFunc = compareFunc;

        this.#parent = initialParent;
    }

    verify(): boolean { // ! to be removed later
        const greaterThanLeft: boolean = this.#leftNode !== undefined ? this.#key > this.#leftNode.#key : true;
        const lessThanRight: boolean = this.#rightNode !== undefined ? this.#key < this.#rightNode.#key : true;

        return greaterThanLeft && lessThanRight && (this.#leftNode?.verify() ?? true) && (this.#rightNode?.verify() ?? true) && Math.abs((this.#rightNode?.height ?? 0) - (this.#leftNode?.height ?? 0)) <= 1;
    }

    get key(): K {
        return this.#key;
    }

    get balanceFactor(): number {
        return (this.#rightNode?.height ?? 0) - (this.#leftNode?.height ?? 0);
    }

    get height(): number {
        return Math.max(this.leftNode?.height ?? 0, this.#rightNode?.height ?? 0) + 1;
    }
    
    get values(): V[] {
        return this.#values;
    }

    get kvp(): KVP<K, V[]> {
        return {
            key: this.#key, 
            value: this.values,
        };
    }

    get parent(): AVLNode<K, V> | undefined {
        return this.#parent;
    }

    set parent(newParent: AVLNode<K, V> | undefined) {
        this.#parent = newParent;
    }

    get leftNode(): AVLNode<K, V> | undefined {
        return this.#leftNode;
    }

    set leftNode(newLeft: AVLNode<K, V> | undefined) { // ! ONLY to be used in the rotation methods
        this.#leftNode = newLeft;
    }

    get rightNode(): AVLNode<K, V> | undefined {
        return this.#rightNode;
    }

    set rightNode(newRight: AVLNode<K, V> | undefined) { // ! ONLY to be used in the rotation methods
        this.#rightNode = newRight; 
    }

    get min(): AVLNode<K, V> {
        return this.#leftNode?.min ?? this;
    }

    get max(): AVLNode<K, V> {
        return this.#rightNode?.max ?? this;
    }

    get successor(): AVLNode<K, V> | undefined {
        if (this.#rightNode) {
            return this.#rightNode.min;
        }

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let searchNode: AVLNode<K, V> = this;
        while (searchNode.parent) {
            if (searchNode.parent.leftNode === searchNode) { // if we are approaching the parent from the left
                return searchNode.parent;
            } else {
                searchNode = searchNode.parent;
            }
        }
        return undefined;
    }

    get predecessor(): AVLNode<K, V> | undefined {
        if (this.#leftNode) {
            return this.#leftNode.max;
        }

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let searchNode: AVLNode<K, V> = this;
        while (searchNode.parent) {
            if (searchNode.parent.rightNode === searchNode) { // if we are approaching the parent from the left
                return searchNode.parent;
            } else {
                searchNode = searchNode.parent;
            }
        }
        return undefined;
    }

    get(key: K): KVP<K, V[]> | undefined {
        const compareResult: CompareResult = this.#compareFunc(key, this.#key);

        switch (compareResult) {
            case 'EQ': return this.kvp;
            case 'GT': return this.#rightNode?.get(key);
            case 'LT': return this.#leftNode?.get(key);
        }
    }

    search(key: K, mode: `closest${'-max' | '-min'}`): AVLNode<K, V> | undefined /* returns the closest thing in this subtree */{
        const compareResult: CompareResult = this.#compareFunc(key, this.#key); // reversed from the other one because the focus is the current key, not the target key as much

        switch (compareResult) {
            case 'EQ': {
                return this;
            }

            case 'GT': {
                const rightSearchResult: AVLNode<K, V> | undefined = this.#rightNode?.search(key, mode);

                switch (mode) {
                    case 'closest-max': {
                        return rightSearchResult;
                    }
                    case 'closest-min': {
                        if (rightSearchResult) {
                            const compareThisToSubtree: CompareResult = this.#compareFunc(this.key, rightSearchResult.key);
                            return compareThisToSubtree === 'GT' ? this : rightSearchResult;
                        } else {
                            return this;
                        }
                    }
                }
                break; // * unreachable but TS really doesn't like it being removed
            }

            case 'LT': {
                const leftSearchResult: AVLNode<K, V> | undefined = this.#leftNode?.search(key, mode);

                switch (mode) {
                    case 'closest-max': {
                        if (leftSearchResult) {
                            const compareThisToSubtree: CompareResult = this.#compareFunc(this.key, leftSearchResult.key);
                            return compareThisToSubtree === 'LT' ? this : leftSearchResult;
                        } else {
                            return this;
                        }
                    }
                    case 'closest-min': {
                        return leftSearchResult;
                    }
                }
                break; // * unreachable but TS really doesn't like it being removed
            }
        }
    }

    insert(key: K, ...items: V[]): AVLNode<K, V> /* new root node, after possible tree rotations */ {
        if (items.length === 0) { return this; }

        const compareResult: CompareResult = this.#compareFunc(key, this.#key);

        switch (compareResult) {
            case 'EQ': {
                this.#values.push(...items);
                return this;
            }
            case 'GT': {
                this.#rightNode = 
                    this.#rightNode?.insert(key, ...items) ?? 
                    new AVLNode<K, V>(key, this.#compareFunc, this, items);
                break;
            }
            case 'LT': {
                this.#leftNode =
                    this.#leftNode?.insert(key, ...items) ?? 
                    new AVLNode<K, V>(key, this.#compareFunc, this, items);
                break;
            }
        }

        const newNode: AVLNode<K, V> = AVLNode.rebalance(this);
        return newNode;
    }

    delete(key: K): AVLNode<K, V> | undefined { // ! VERY WIP, DOESN'T WORK AAAAAAAA                       WHY IS THIS THE WAY IT IS
        const compareResult: CompareResult = this.#compareFunc(key, this.#key);

        let newNode: AVLNode<K, V>;

        switch (compareResult) {
            case 'EQ': {
                if (this.#rightNode) {
                    if (this.#leftNode) {
                        //TODO: FIX THIS THINGYYYYYYs
                        //pain time - node has two children, have to do some painful things to proceed
                        const successor = this.successor as AVLNode<K, V>;

                        this.#rightNode = this.#rightNode.delete(successor.key); //this works, because it will only have one right child at most, as the minimum of its subtree
                        
                        successor.parent = this.#parent;
                        [successor.rightNode, successor.leftNode] = [this.#rightNode, this.#leftNode]; //effectively replace current node with new node
                        
                        newNode = successor;
                    } else {
                        //single replace - right
                        newNode = this.#rightNode;
                    }
                } else {
                    if (this.#leftNode) {
                        //single replace - left
                        newNode = this.#leftNode;
                    } else {
                        //delete target has no child, this tree goes bye bye
                        return undefined;
                    }
                }
                break;
            }

            case 'GT': {
                if (this.#rightNode) {
                    this.#rightNode = this.#rightNode.delete(key);
                    newNode = this;
                } else {
                    return this;
                }
                break;
            }

            case 'LT': {
                if (this.#leftNode) {
                    this.#leftNode = this.#leftNode.delete(key);
                    newNode = this;
                } else {
                    return this;
                }
                break;
            }
        }

        newNode = AVLNode.rebalance(newNode);
        return newNode;
    }

    static rebalance<K, V>(tree: AVLNode<K, V>): AVLNode<K, V>  /* new (balanced) node, and if rebalancing was necessary */ {
        // determine what imbalance type the tree has, then fix it :)
        // --> based on what balance factor of current tree and largest child are.
        if (tree.balanceFactor >= 2) {
            //console.warn(`my temporary balance factor is: ${tree.balanceFactor}`);
            if ((tree.rightNode as AVLNode<K, V>).balanceFactor >= 0) {
                //console.log(`performing a left rotation`);
                return AVLNode.rotateLeft(tree);
            } else {
                //console.log(`performing a rightleft rotation`);
                return AVLNode.rotateRightLeft(tree);
            }
        }
        if (tree.balanceFactor <= -2) {
            //console.warn(`my temporary balance factor is: ${tree.balanceFactor}`);
            if ((tree.leftNode as AVLNode<K, V>).balanceFactor <= 0) {
                //console.log(`performing a right rotation`);
                return AVLNode.rotateRight(tree);
            } else {
                //console.log(`performing a leftright rotation`);
                return AVLNode.rotateLeftRight(tree); 
            }
        }
        return tree;
    }

    static rotateRight<K, V>(tree: AVLNode<K, V>): AVLNode<K, V> {
        const newRoot: AVLNode<K, V> = tree.leftNode as AVLNode<K, V>;
        [newRoot.parent, tree.parent] = [tree.parent, newRoot]; // swaps parents
        [newRoot.rightNode, tree.leftNode] = [tree, newRoot.rightNode]; // swaps inner children of each node, almost
        if (tree.leftNode) {
            tree.leftNode.parent = tree;
        }

        //update balance factors

        //console.log(`new root balanceFactor: ${newRoot.balanceFactor} \n new oldRoot balanceFactor: ${newRoot.rightNode.balanceFactor}`);
        

        return newRoot;
    }

    static rotateLeft<K, V>(tree: AVLNode<K, V>): AVLNode<K, V> {
        const newRoot: AVLNode<K, V> = tree.rightNode as AVLNode<K, V>;
        [newRoot.parent, tree.parent] = [tree.parent, newRoot]; // swaps parents
        [newRoot.leftNode, tree.rightNode] = [tree, newRoot.leftNode]; // swaps inner children of each node, almost
        if (tree.rightNode) {
            tree.rightNode.parent = tree;
        }

        // update balance factors

        //console.log(`new root balanceFactor: ${newRoot.balanceFactor} \n new oldRoot balanceFactor: ${newRoot.leftNode.balanceFactor}`);

        return newRoot;
    }

    static rotateRightLeft<K, V>(tree: AVLNode<K, V>): AVLNode<K, V> {
        tree.rightNode = AVLNode.rotateRight(tree.rightNode as AVLNode<K, V>); //rotateRight the right child node
        const newRoot: AVLNode<K, V> = AVLNode.rotateLeft(tree); //rotateLeft the root node

        
        return newRoot;
    }

    static rotateLeftRight<K, V>(tree: AVLNode<K, V>): AVLNode<K, V> {
        tree.leftNode = AVLNode.rotateLeft(tree.leftNode as AVLNode<K, V>); //rotateLeft the left child node
        const newRoot: AVLNode<K, V> = AVLNode.rotateRight(tree); //rotateRight the root node

        return newRoot;
    }
}