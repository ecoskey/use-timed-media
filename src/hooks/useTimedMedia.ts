import { useEffect, useReducer, useRef, useState } from 'react';
import AVLIterator from '../bst/AVLIterator';
import useAnimationFrame from 'use-animation-frame';
import AVLTree from '../bst/AVLTree';
import clamp from '../util/clamp';
import compareNums from '../util/compareNums';
import type { KVP }  from '../util/KeyValuePair';
import EventBus, { CallbackFromTuple } from '../util/EventBus';
import AVLNode from '../bst/AVLNode';
import { getIterableFirst } from '../util/Iterables';

export interface PlaybackState {
    playing: boolean,
    playDir: 'forward' | 'reverse',
    time: number,
    length: number,
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

export default function useTimedMedia<E>(config: Partial<PlaybackState> & { seek?: boolean }, items?: Iterable<KVP<number, E[]>> | null | undefined): TimedMediaAPI<E> {
    const [ timeline ] = useState<AVLTree<number, E>>(() => new AVLTree(compareNums, items));

    const [ playbackState, setPlaybackState ] = useState<PlaybackState>({...{
        playing: true,
        playDir: 'forward',
        time: 0,
        length: timeline.max?.key ?? 0,
    }, ...config});

    const { //make state accessible with less text through object desctructuring. still assign to them through setPlayBackState function though.
        playing,
        playDir,
        time,
        length,
    } = playbackState;

    const [ handlers ] = useState<EventBus<TimedMediaEvents<E>>>(new EventBus());

    const [ playHead, setPlayHead ] = useState<AVLNode<number, E> | undefined>(timeline.root?.search(time, playDir === 'forward' ? 'closest-max' : 'closest-min'));

    // --- --- ---[ update state with new props and handle stuff accordingly ]--- --- ---

    addToPlaybackState(config);

    if ((config.playing && config.playing !== playing) || (config.playDir && config.playDir !== playDir)) { handleSetPlaying(); }
    if ((config.time && config.time !== time) || config.seek) { handleSeek(); }
    if (config.length && config.length !== length) { handleSetLength(); }

    // --- --- ---[ function declarations for handling changing state, and timer function ]--- --- ---

    //update state with new props
    function addToPlaybackState(newState: Partial<PlaybackState>): void { 
        setPlaybackState({...playbackState, ...newState});
    }

    function handleSetPlaying(): void { //reset playHead when direction / startTime changes, and set new playHead and currentTime accordingly.
        playHead.current = timeline.entries(playDir === 'forward' ? 'ascending' : 'descending', startTime);
        playHead.current.next();
        currentTime.current = startTime;

        // --- --- ---[ Handlers ]--- --- ---
        handlers.dispatch('togglePlayDirection', playDir);
        handlers.dispatch('seek', startTime);
    }, [timeline, playDir, startTime, handlers]);

    function handleSeek(): void { //update startTime to current place on timeline I guess? can probably do it dual-edge, it shouldn't be too slow
        setStartTime(currentTime.current);

        // --- --- ---[ Handlers ]--- --- ---
        handlers.dispatch('togglePlayback', playing, currentTime.current);
    }, [playing, handlers]); 

    function handleSetLength(): void { // if new maxTime is lower than the time the playhead is at, handle accordingly and clamp current time
        if (maxTime < currentTime.current)  { // if new maxTime is lower than the time the playhead is at
            setPlaying(playDir === 'reverse'); // * if playing in reverse, keeps playing and seeks to new maxTime
            setStartTime(maxTime);
        }

        // --- --- ---[ Handlers ]--- --- ---
        handlers.dispatch('setMaxTime', maxTime);
    }, [maxTime, playDir, handlers]);

    useAnimationFrame(({ delta }) => {
        if (!playing) { return; }

        //update currentTime, if we've passed an event node than call handlers and update playHead to next.
        const newTime = 
            playDir === 'forward' ? 
            time + (delta * 1000) : 
            time - (delta * 1000) ;

        addToPlaybackState({ time: newTime });

        const hasNextEvent = playHead !== undefined && (playDir === 'forward' ? length > playHead.key : playHead.key > 0);
        const hasOverflowed = playDir === 'forward' ? length <= time : time <= 0;

        const nextEvent = playDir === 'forward' ? playHead ?? {key: length, value: []} : playHead ?? {key: 0, value: []};
        const timeUntilNext = playDir === 'forward' ? nextEvent.key - currentTime.current : currentTime.current - nextEvent.key;

        if (hasNextEvent && timeUntilNext <= 0) {
            playHead.current.next();

            // --- --- ---[ Handlers ]--- --- ---
            handlers.dispatch('media', nextEvent.value, nextEvent.key);
        } 
        if (hasOverflowed) {
            addToPlaybackState({
                playing: false,
                time: playDir === 'forward' ? length : 0,
            });

            // --- --- ---[ Handlers ]--- --- ---
            handlers.dispatch('end');
        }
    }, [playing, playDir, startTime, handlers]);

    return { //? what to return for API?
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