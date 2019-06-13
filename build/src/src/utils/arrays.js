/**
 * Filters array non unique values
 * @param {array} a
 * @returns {array} a with unique values only
 */
function uniqueValues(a) {
  return a.filter((value, index, self) => self.indexOf(value) === index);
}

module.exports = {
  uniqueValues
};
