import { useEffect, useRef } from 'react';

export default function useAnimationFrame(
    fn: (time: DOMHighResTimeStamp, delta: DOMHighResTimeStamp) => void,
    deps: React.DependencyList = [],
    animating: boolean | (() => boolean) = true,
): void {
    const animID = useRef<number>(0);
    const animStatus = useRef<boolean>(false);

    const startTime = useRef<DOMHighResTimeStamp>(performance.now());   
    const time = useRef<DOMHighResTimeStamp>(startTime.current);
    const lastTime = useRef<DOMHighResTimeStamp>(startTime.current);

    const frameFn = (timeStamp: DOMHighResTimeStamp): void => {
        lastTime.current = time.current;
        time.current = timeStamp - startTime.current;

        fn(time.current, time.current - lastTime.current);

        requestAnimationFrame(frameFn);
    };

    useEffect(() => {
        const toAnimate: boolean = typeof animating === 'function' ? animating() : animating;

        if (toAnimate) {
            animID.current = requestAnimationFrame(frameFn);
            animStatus.current = true;
        }

        return () => {
            if (animStatus.current) {
                cancelAnimationFrame(animID.current);
                animStatus.current = false;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fn, animating, ...deps]);
}