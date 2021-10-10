import { useEffect, useRef } from 'react';

export default function useAnimationFrame(
    fn: (time: DOMHighResTimeStamp, delta: DOMHighResTimeStamp) => void,
    deps: React.DependencyList = [],
    animating = true,
): void {
    const animID = useRef<number | undefined>(0);

    const startTime = useRef<DOMHighResTimeStamp>(performance.now());   
    const time = useRef<DOMHighResTimeStamp>(startTime.current);
    const lastTime = useRef<DOMHighResTimeStamp>(startTime.current);

    const frameFn = (timeStamp: DOMHighResTimeStamp): void => {
        lastTime.current = time.current;
        time.current = timeStamp - startTime.current;

        fn(time.current, time.current - lastTime.current);

        animID.current = requestAnimationFrame(frameFn); 
    };

    useEffect(() => {
        if (animating) {
            animID.current = requestAnimationFrame(frameFn);
        } else if (animID.current !== undefined) {
            cancelAnimationFrame(animID.current);
        }

        return () => {
            if (animID.current !== undefined) {
                cancelAnimationFrame(animID.current);
                animID.current = undefined;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fn, animating, ...deps]);
}