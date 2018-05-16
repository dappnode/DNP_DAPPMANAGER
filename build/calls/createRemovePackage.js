const DockerCompose = require('../utils/DockerCompose')
const fs = require('fs')
const getPath = require('../utils/getPath')


function createRemovePackage(params,
  // default option passed to allow testing
  dockerCompose) {

  return async function removePackage(req) {

    const PACKAGE_NAME = req[0]
    const DOCKERCOMPOSE_PATH = getPath.DOCKERCOMPOSE(PACKAGE_NAME, params)

    if (!fs.existsSync(DOCKERCOMPOSE_PATH)) {
      throw Error('No docker-compose found with at: ' + DOCKERCOMPOSE_PATH)
    }

    await dockerCompose.down(DOCKERCOMPOSE_PATH)

    return JSON.stringify({
        success: true,
        message: 'Removed package: ' + PACKAGE_NAME
    })
  }
}


module.exports = createRemovePackage
