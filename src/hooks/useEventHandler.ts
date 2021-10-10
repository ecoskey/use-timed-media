import { useEffect, useState } from 'react';
import EventBus from '../util/EventBus';

export default function useEventHandler<
    E extends Record<string, readonly unknown[]>,
    K extends keyof E,
>(
    bus: EventBus<E>, 
    key: K, 
    callback: (...params: E[K]) => void
): void {
    const [callbackID, setCallbackID] = useState<number>(0);

    useEffect(() => {
        setCallbackID(bus.on(key, callback));

        return () => bus.unsubscribe(key, callbackID);
    }, [bus, key, callback]);
}