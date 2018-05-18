

module.exports = {

  // Used to standarize call responses, example:
  // > const res = require('../utils/res')
  // > return res.success("Fetched info of: " + packageReq.name, packageWithVersions)

  success: (message, result = {}) => {

    console.trace("SUCCESS MESSAGE: " + message)
    // console.log('--------------\n User called method with success')
    // console.log('  response message: ' + message+ '\n  result: ')
    // console.log(result)
    return JSON.stringify({
        success: true,
        message,
        result
    })
  }
}
