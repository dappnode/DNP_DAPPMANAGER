const logs = require('../logs.js')(module);

module.exports = {

  // Used to standarize call responses, example:
  // > const res = require('../utils/res')
  // > return res.success("Fetched info of: " + packageReq.name, packageWithVersions)

  success: (message, result = {}, log = false) => {
    if (log) logs.info('[res.js 11] ', message);

    return JSON.stringify({
        success: true,
        message,
        result,
    });
  },
};
