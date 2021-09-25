import { MutableRefObject, useEffect, useReducer, useRef, useState } from 'react';
import AVLIterator, { IteratorDirection } from '../bst/AVLIterator';
//import useAnimationFrame from 'use-animation-frame';
import AVLTree from '../bst/AVLTree';
import compareNums from '../util/compareNums';
import defaulted from '../util/Defaulted';
import { KVP } from '../util/KeyValuePair';

export interface TimedMediaConfig {
    autoplay?: boolean,
    playDir?: 'forward' | 'reverse',
    startTime?: number,
}

export default function useTimedMedia<E>(config: TimedMediaConfig, items?: Iterable<KVP<number, E[]>> | null | undefined) {
    const [ timeline, setTimeline ] = useState<AVLTree<number, E>>(() => new AVLTree(compareNums, items));

    const [ playing, setPlaying ] = useState<boolean>(config.autoplay ?? true);
    const [ playDir, setPlayDir ] = useState<'forward' | 'reverse'>(config.playDir ?? 'forward');
    const [ maxTime, setMaxTime ] = useState<number>();
    const [ startTime, setStartTime] = useState<number>(config.startTime /* TODO: Clamp to [0, maxTime] */?? 0);

    // TODO:  const [ handlers, addHandler ] = useReducer( etc etc )

    

    const playHead = useRef<AVLIterator<number, E>>(timeline.entries(/* among us (finish this declaration) */));

    useEffect(() => { //reset playHead when direction changes

    }, [playDir]);

    /*useAnimationFrame(() => {

    }, [state.playing, state.playDirection]); */

    return {
        setPlaying: setPlaying,
        setPlayDir: setPlayDir,
        setMaxTime: setMaxTime,
        setStartTime: setStartTime,
    };
}