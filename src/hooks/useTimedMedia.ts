import React, { useState } from 'react';
import AVLTree from '../bst/AVLTree';
import compareNums from '../util/compareNums';
import { KVP } from '../util/KeyValuePair';

export interface timedMediaConfig {
    autoplay?: boolean,
    playDirection?: 'forward' | 'backward',

}

export interface timedMediaConfigDefaults {
    autoplay: false,
    playDirection: 'forward',

}

export default function useTimedMedia<E>(config: timedMediaConfig, items?: Iterable<KVP<number, E[]>> | null | undefined) {
    const [timeline, setTimeline] = useState(() => new AVLTree(compareNums, items));
} 