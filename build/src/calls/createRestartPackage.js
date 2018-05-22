const fs = require('fs')
const DockerCompose = require('../utils/DockerCompose')
const getPath =       require('../utils/getPath')
const res =           require('../utils/res')

// CALL DOCUMENTATION:
// > result = logs = <String with escape codes> (string)

function createRestartPackage(params,
  // default option passed to allow testing
  dockerCompose) {

  return async function restartPackage(req) {

    const PACKAGE_NAME = req[0]
    const IS_CORE = req[1]
    const CORE_PACKAGE_NAME = IS_CORE ? PACKAGE_NAME : null

    const DOCKERCOMPOSE_PATH = getPath.DOCKERCOMPOSE(PACKAGE_NAME, params, IS_CORE)
    if (!fs.existsSync(DOCKERCOMPOSE_PATH)) {
      throw Error('No docker-compose found with at: ' + DOCKERCOMPOSE_PATH)
    }

    await dockerCompose.restart(DOCKERCOMPOSE_PATH, {core: CORE_PACKAGE_NAME})

    return res.success('Restarted package: ' + PACKAGE_NAME)

  }
}


module.exports = createRestartPackage
