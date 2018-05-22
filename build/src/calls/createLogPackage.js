const fs = require('fs')
const getPath =       require('../utils/getPath')
const res =           require('../utils/res')

// CALL DOCUMENTATION:
// > result = logs = <String with escape codes> (string)

// If it is core, send ['dnp_bind', true]

function createLogPackage(params,
  // default option passed to allow testing
  docker) {

  return async function logPackage(req) {

    const PACKAGE_NAME = req[0]
    const IS_CORE = req[1]
    const CORE_PACKAGE_NAME = IS_CORE ? PACKAGE_NAME : null

    const DOCKERCOMPOSE_PATH = getPath.DOCKERCOMPOSE(PACKAGE_NAME, params, IS_CORE)
    if (!fs.existsSync(DOCKERCOMPOSE_PATH)) {
      throw Error('No docker-compose found with at: ' + DOCKERCOMPOSE_PATH)
    }

    let logs = await docker.compose.logs(DOCKERCOMPOSE_PATH, {core: CORE_PACKAGE_NAME})

    return res.success('Got logs of package: ' + PACKAGE_NAME, {
      name: PACKAGE_NAME,
      logs
    })

  }
}


module.exports = createLogPackage
