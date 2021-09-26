declare module 'use-animation-frame' {
    export const _default: (cb: (time: {time: number, delta: number}) => void | VoidFunction, deps?: React.DependencyList) => React.EffectCallback;
    export default _default;
}
