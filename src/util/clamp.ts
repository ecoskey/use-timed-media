export default function clamp(target: number, bound1: number, bound2: number): number {
    const minBound: number = Math.min(bound1, bound2);
    const maxBound: number = Math.max(bound1, bound2);

    return Math.max(minBound, Math.min(maxBound, target));
} 