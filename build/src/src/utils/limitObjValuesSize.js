const { mapValues } = require("lodash");

function limitObjValuesSize(obj, maxLen) {
  if (!obj || typeof obj !== "object") return obj;
  return mapValues(obj, value => {
    try {
      const s =
        typeof value === "object" ? JSON.stringify(value) : String(value);
      return s.length > maxLen ? s.slice(0, maxLen) : value;
    } catch (e) {
      return value;
    }
  });
}

module.exports = limitObjValuesSize;
