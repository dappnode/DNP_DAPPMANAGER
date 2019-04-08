/**
 * Same as array.map(fn) but for objects and called as mapObj(obj, fn)
 *
 * @param {object} obj Object to be transformed
 * @param {function} fn Callback, will receive one argument, an object value
 * @return {object} New object transformed
 */
function mapObj(obj, fn) {
  const _obj = {};
  for (let key of Object.keys(obj)) {
    _obj[key] = fn(obj[key]);
  }
  return _obj;
}

/**
 * Same as array.map(fn) but for objects and called as mapObj(obj, fn)
 *
 * @param {object} obj Object to be transformed
 * @param {function} fn Callback, will receive one argument, an object value
 * @param {boolean} byKey if the filtering will be done by key or value
 * @return {object} New object transformed
 */
function filterObj(obj, fn, byKey = false) {
  const _obj = {};
  for (let key of Object.keys(obj)) {
    if (fn(byKey ? key : obj[key])) {
      _obj[key] = obj[key];
    }
  }
  return _obj;
}

module.exports = {
  mapObj,
  filterObj
};
