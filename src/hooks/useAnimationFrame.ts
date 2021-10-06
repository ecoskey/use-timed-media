import { useEffect, useRef } from 'react';

export default function useAnimationFrame(
    fn: (time: DOMHighResTimeStamp, delta: DOMHighResTimeStamp) => void,
    deps: React.DependencyList = [],
    animating?: boolean | (() => boolean),
): void {
    const animID = useRef<number>(0);
    const animStatus = useRef<boolean>(false);

    const time = useRef<number>(0);
    const lastTime = useRef<number>(0);

    const animateFn: (timeStamp: DOMHighResTimeStamp) => void = (timeStamp: DOMHighResTimeStamp) => {
        lastTime.current = time.current;
        time.current = timeStamp;

        fn(time.current, time.current - lastTime.current);

        requestAnimationFrame(animateFn);
    };

    useEffect(() => {
        const toAnimate: boolean = typeof animating === 'function' ? animating() : animating ?? true;

        if (toAnimate) {
            animID.current = requestAnimationFrame(animateFn);
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