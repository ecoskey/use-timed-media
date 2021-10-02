import { useEffect, useRef, useState } from 'react';
import AVLIterator from '../bst/AVLIterator';
import useAnimationFrame from 'use-animation-frame';
import AVLTree from '../bst/AVLTree';
import clamp from '../util/clamp';
import compareNums from '../util/compareNums';
import type { KVP }  from '../util/KeyValuePair';
import EventBus, { CallbackFromTuple } from '../util/EventBus';

export interface TimedMediaConfig {
    autoplay?: boolean,
    playDir?: 'forward' | 'reverse',
    startTime?: number,
    lengthOverride?: number,
}

export interface TimedMediaEvents<E> extends Record<string, readonly unknown[]> {
    media: [events: E[], time: number],
    togglePlayback: [nowPlaying: boolean, time: number],
    togglePlayDirection: [playDirection: 'forward' | 'reverse'],
    setMaxTime: [maxTime: number],
    seek: [time: number],
    end: [],
}

export interface TimedMediaAPI<E> {
    readonly on: EventBus<TimedMediaEvents<E>>['on'],
    readonly unsubscribe: EventBus<TimedMediaEvents<E>>['unsubscribe'],
    readonly clear: EventBus<TimedMediaEvents<E>>['clear'],

    playing: boolean,
    playDirection: 'forward' | 'reverse',
    time: number,
    length: number,
}

export default function useTimedMedia<E>(config: TimedMediaConfig, items?: Iterable<KVP<number, E[]>> | null | undefined): TimedMediaAPI<E> {
    const [ timeline ] = useState<AVLTree<number, E>>(() => new AVLTree(compareNums, items));

    const [ playing, setPlaying ] = useState<boolean>(config.autoplay ?? true);
    const [ playDir, setPlayDir ] = useState<'forward' | 'reverse'>(config.playDir ?? 'forward');
    const [ maxTime, setMaxTime ] = useState<number>( config.lengthOverride ?? timeline.max?.key ?? 0);
    const [ startTime, setStartTime ] = useState<number>(config.startTime ? clamp(config.startTime, 0, maxTime) : (playDir === 'forward' ? 0 : maxTime));

    const [ handlers ] = useState<EventBus<TimedMediaEvents<E>>>(new EventBus());

    const playHead = useRef<AVLIterator<number, E>>(timeline.entries(playDir === 'forward' ? 'ascending' : 'descending', startTime));
    const currentTime = useRef<number>(startTime);

    useEffect(() => { //reset playHead when direction / startTime changes, and set new playHead and currentTime accordingly.
        playHead.current = timeline.entries(playDir === 'forward' ? 'ascending' : 'descending', startTime);
        playHead.current.next();
        currentTime.current = startTime;

        // --- --- ---[ Handlers ]--- --- ---
        handlers.dispatch('togglePlayDirection', playDir);
        handlers.dispatch('seek', startTime);
    }, [timeline, playDir, startTime, handlers]);

    useEffect(() => { //update startTime to current place on timeline I guess? can probably do it dual-edge, it shouldn't be too slow
        setStartTime(currentTime.current);

        // --- --- ---[ Handlers ]--- --- ---
        handlers.dispatch('togglePlayback', playing, currentTime.current);
    }, [playing, handlers]); 

    useEffect(() => {
        if (maxTime < currentTime.current)  { // if new maxTime is lower than the time the playhead is at
            setPlaying(playDir === 'reverse'); // * if playing in reverse, keeps playing and seeks to new maxTime
            setStartTime(maxTime);
        }

        // --- --- ---[ Handlers ]--- --- ---
        handlers.dispatch('setMaxTime', maxTime);
    }, [maxTime, playDir, handlers]);

    useAnimationFrame(({ time }) => {
        if (!playing) {
            return;
        }

        //update currentTime, if we've passed an event node than call handlers and update playHead to next.
        if (playDir === 'forward') {
            currentTime.current = startTime + (time * 1000);
        } else {
            currentTime.current = startTime - (time * 1000);
        }

        const hasNextEvent = playHead.current.current.value !== undefined && (playDir === 'forward' ? maxTime > playHead.current.current.value.key : playHead.current.current.value.key > 0);
        const hasOverflowed = playDir === 'forward' ? currentTime.current >= maxTime : currentTime.current <= 0;

        const nextEvent = playDir === 'forward' ? playHead.current.current.value ?? {key: maxTime, value: []} : playHead.current.current.value ?? {key: 0, value: []};
        const timeUntilNext = playDir === 'forward' ? nextEvent.key - currentTime.current : currentTime.current - nextEvent.key;

        if (hasNextEvent && timeUntilNext <= 0) {
            playHead.current.next();

            // --- --- ---[ Handlers ]--- --- ---
            handlers.dispatch('media', nextEvent.value, nextEvent.key);
        } 
        if (hasOverflowed) {
            setPlaying(false);
            setStartTime(maxTime);

            // --- --- ---[ Handlers ]--- --- ---
            handlers.dispatch('end');
        }
    }, [playing, playDir, startTime, handlers]);

    return {
        on: <K extends keyof TimedMediaEvents<E>>(event: K, callback: CallbackFromTuple<TimedMediaEvents<E>[K]>) => handlers.on(event, callback),
        unsubscribe: <K extends keyof TimedMediaEvents<E>>(event: K, target: number) => handlers.unsubscribe(event, target),
        clear: () => handlers.clear(),

        get playing() { return playing; },
        set playing(playing: boolean) { setPlaying(playing); },

        get playDirection() { return playDir; },
        set playDirection(dir: 'forward' | 'reverse') { setPlayDir(dir); },

        get time() { return currentTime.current; },
        set time(time: number) { setStartTime(time); },

        get length() { return maxTime; },
        set length(newLength: number) { setMaxTime(newLength); },
    };
}