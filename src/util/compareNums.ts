import { CompareResult } from '../util/CompareFunc';

export default function compareNums(a: number, b: number): CompareResult {
    if (a === b) {
        return 'EQ'; 
    } else if (a > b) {
        return 'GT'; 
    } else {
        return 'LT';
    }
}