/**
 * Filters array non unique values
 * @param {array} a
 * @returns {array} a with unique values only
 */
function uniqueValues(a) {
  return a.filter((value, index, self) => self.indexOf(value) === index);
}

/**
 * Checks if `a2` includes all elements of `a1`
 * @param {array} a1
 * @param {array} a2
 */
function includesArray(a1, a2) {
  return a1.every(elem => a2.indexOf(elem) > -1);
}

module.exports = {
  uniqueValues,
  includesArray
};
