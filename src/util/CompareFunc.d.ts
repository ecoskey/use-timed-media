export type CompareResult = 'GT' | 'EQ' | 'LT'; //greater than / equal to / less than

export type CompareFunc<T> = (a: T, b: T) => CompareResult;