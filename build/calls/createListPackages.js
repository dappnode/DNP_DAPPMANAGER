const dockerCalls_default = require('../modules/calls/dockerCalls')
const getPath = require('../utils/getPath')
const { parseEnvFile } = require('../utils/parse')
const fs = require('fs')


function createListPackages(params,
  // default option passed to allow testing
  dockerCalls=dockerCalls_default) {

  return async function listPackages(req) {

    let dnpList = await dockerCalls.listContainers()

    // Add env info
    dnpList.map((dnp) => {
      let PACKAGE_NAME = dnp.name
      let ENV_FILE = getPath.ENV_FILE(PACKAGE_NAME, params)
      if (fs.existsSync(ENV_FILE)) {
        let envFileData = fs.readFileSync(ENV_FILE, 'utf8')
        dnp.envs = parseEnvFile(envFileData)
      }
    })
    console.log(dnpList)
    // Return
    return JSON.stringify({
        success: true,
        message: "Listing " + dnpList.length + " packages",
        result: dnpList
    })
  }
}



module.exports = createListPackages
