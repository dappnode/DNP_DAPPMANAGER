const merge = require("deepmerge");

/**
 * Util to remove repeated elements from an array
 * @param {array} arrArg array
 * @returns {array} Array without duplicated arguments
 */
const uniqArray = arrArg =>
  arrArg.filter((elem, pos, arr) => arr.indexOf(elem) == pos);

/**
 * Util for the deepmerge library. Overwrites default array merging behaviour
 * to return a deduplicated copy of an array
 * @param {array} destinationArray
 * @param {array} sourceArray
 * @returns {array} Merge of the two arrays without duplicate items
 */
const uniqueArrays = (destinationArray, sourceArray) =>
  uniqArray(merge(destinationArray, sourceArray));

/**
 * Merges object packages, returning unique arrays.
 * Used to remove duplicate versions in the package version array
 * pkgsObject = {
 *   A: [ '2.0.0' ],
 *   C: [ '2.0.0', '1.0.0' ],
 *   B: [ '1.0.0', '1.1.0', '2.0.0' ]
 * }
 * @param {*} pkgsObj1
 * @param {*} pkgsObj2
 * @returns {object} pkgsObjects merged
 */
const mergePkgs = (pkgsObj1, pkgsObj2) => {
  // Check arguments
  if (!pkgsObj1) throw Error("pkgsObj1 is undefined");
  if (!pkgsObj2) throw Error("pkgsObj2 is undefined");

  return merge(pkgsObj1, pkgsObj2, {
    arrayMerge: uniqueArrays
  });
};

module.exports = mergePkgs;
