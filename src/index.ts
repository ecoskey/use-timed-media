import AVLTree from './bst/AVLTree';
import useTimedMedia from './hooks/useTimedMedia';
import compareNums from './util/compareNums';

export default useTimedMedia;

const test = new AVLTree(compareNums, [
    {key: 1000, value: [1]},
    {key: 2000, value: [2]},
    {key: 3000, value: [3]}
]);

console.log('test', [...test.entries('descending', 250)]);