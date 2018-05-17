const fs = require('fs')
const dockerList_default = require('../modules/dockerList')
const getPath = require('../utils/getPath')
const parse =   require('../utils/parse')
const res =     require('../utils/res')

// CALL DOCUMENTATION:
// > result = dnpList =
//   [
//     {
//       id: '9238523572017423619487623894', (string)
//       isDNP: true, (boolean)
//       created: <Date string>,
//       image: <Image Name>, (string)
//       name: otpweb.dnp.dappnode.eth, (string)
//       shortName: otpweb, (string)
//       version: '0.0.4', (string)
//       ports: <list of ports>, (string)
//       state: 'exited', (string)
//       running: true, (boolean)
//       ...
//       envs: <Env variables> (object)
//     },
//     ...
//   ]

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

    return res.success("Listing " + dnpList.length + " packages", dnpList)

  }
}



module.exports = createListPackages
