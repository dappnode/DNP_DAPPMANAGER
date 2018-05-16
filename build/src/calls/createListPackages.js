const dockerList_default = require('../modules/dockerList')
const getPath = require('../utils/getPath')
const parse = require('../utils/parse')
const fs = require('fs')


function createListPackages(params,
  // default option passed to allow testing
  dockerList=dockerList_default) {

  return async function listPackages(req) {

    let dnpList = await dockerList.listContainers()

    // Add env info
    dnpList.map((dnp) => {
      let PACKAGE_NAME = dnp.name
      let ENV_FILE = getPath.ENV_FILE(PACKAGE_NAME, params)
      if (fs.existsSync(ENV_FILE)) {
        let envFileData = fs.readFileSync(ENV_FILE, 'utf8')
        dnp.envs = parse.envFile(envFileData)
      }
    })

    // Return
    console.trace("Listing " + dnpList.length + " packages")
    return JSON.stringify({
        success: true,
        message: "Listing " + dnpList.length + " packages",
        result: dnpList
    })
  }
}



module.exports = createListPackages
