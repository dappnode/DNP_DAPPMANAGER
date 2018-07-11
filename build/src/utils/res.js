

module.exports = {

  // Used to standarize call responses, example:
  // > const res = require('../utils/res')
  // > return res.success("Fetched info of: " + packageReq.name, packageWithVersions)

  success: (message, result = {}, log = false) => {
    if (log) console.log('(11 res.js)' + message);

    return JSON.stringify({
        success: true,
        message,
        result,
    });
  },
};
