import { useEffect, useRef, useState } from 'react';
import AVLIterator from '../bst/AVLIterator';
import useAnimationFrame from 'use-animation-frame';
import AVLTree from '../bst/AVLTree';
import clamp from '../util/clamp';
import compareNums from '../util/compareNums';
import { KVP } from '../util/KeyValuePair';

export interface TimedMediaConfig {
    autoplay?: boolean,
    playDir?: 'forward' | 'reverse',
    startTime?: number,
    lengthOverride?: number,
}

export default function useTimedMedia<E>(config: TimedMediaConfig, items?: Iterable<KVP<number, E[]>> | null | undefined): void {
    const [ timeline, setTimeline ] = useState<AVLTree<number, E>>(() => new AVLTree(compareNums, items));

    const [ playing, setPlaying ] = useState<boolean>(config.autoplay ?? true);
    const [ playDir, setPlayDir ] = useState<'forward' | 'reverse'>(config.playDir ?? 'forward');
    const [ maxTime, setMaxTime ] = useState<number>( config.lengthOverride ?? timeline.max?.[0] ?? 0);
    const [ startTime, setStartTime] = useState<number>(config.startTime ? clamp(config.startTime, 0, maxTime) : 0);

    // TODO:  const [ handlers, addHandler ] = useReducer( etc etc )

    const playHead = useRef<AVLIterator<number, E>>(timeline.entries(playDir === 'forward' ? 'ascending' : 'descending', startTime));
    const currentTime = useRef<number>(startTime);

    useEffect(() => { //reset playHead when direction / startTime changes, and set new playHead and currentTime accordingly.
        playHead.current = timeline.entries(playDir === 'forward' ? 'ascending' : 'descending', startTime);
        currentTime.current = startTime;
    }, [playDir, startTime]);

    useEffect(() => { //update startTime to current place on timeline I guess? can probably do it dual-edge, it shouldn't be too slow
        setStartTime(currentTime.current);
    }, [playing]); 

    useEffect(() => {
        if (maxTime < currentTime.current)  { // if new maxTime is lower than the time the playhead is at
            setPlaying(false);
            setStartTime(maxTime);
        }
    }, [maxTime]);

    useAnimationFrame(({ time }) => {
        //update currentTime, if we've passed an event node than call handlers and update playHead to next.
        // ? figure out how to deal with end conditions / when there are nodes outside of timeline range?
        if (playDir === 'forward') {
            currentTime.current = startTime + (time * 1000);
        } else {
            currentTime.current = startTime - (time * 1000);
        }

        const hasNextEvent = playHead.current.current.value !== undefined && (playDir === 'forward' ? maxTime < playHead.current.current.value[0] : playHead.current.current.value[0] < 0);
        const hasOverflowed = playDir === 'forward' ? currentTime.current >= maxTime : currentTime.current <= 0;

        const nextEvent = playDir === 'forward' ? playHead.current.current.value ?? [maxTime, []] : playHead.current.current.value ?? [0, []];

        if (currentTime.current >= nextEvent[0] && hasNextEvent) {
            playHead.current.next();
            console.log(`cheems ${nextEvent[0]}`);
        } 
        if (hasOverflowed) {
            setPlaying(false);
            setStartTime(maxTime);
        }
    }, [playing, playDir, startTime]);

    return undefined; // ? return object with api functions? 
}