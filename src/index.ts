import AVLTree from './bst/AVLTree';
import useTimedMedia from './hooks/useTimedMedia';
import compareNums from './util/compareNums';

export default useTimedMedia;

const test = new AVLTree(compareNums, [
    {key: 100, value: [1]},
    {key: 200, value: [2]},
    {key: 300, value: [3]}
]);

console.log('test', [...test.entries('descending', 250)]);