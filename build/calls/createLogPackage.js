const { Docker_compose } = require('../modules/calls/dockerCalls')
const fs = require('fs')
const getPath = require('../utils/getPath')
const docker_compose_default = new Docker_compose()


function createLogPackage(params,
  // default option passed to allow testing
  docker_compose=docker_compose_default) {

  return async function logPackage(req) {

    const PACKAGE_NAME = req[0]
    const DOCKERCOMPOSE_PATH = getPath.DOCKERCOMPOSE(PACKAGE_NAME, params)

    if (!fs.existsSync(DOCKERCOMPOSE_PATH)) {
      throw Error('No docker-compose found with at: ' + DOCKERCOMPOSE_PATH)
    }

    let logs = await docker_compose.logs(DOCKERCOMPOSE_PATH)

    return JSON.stringify({
        success: true,
        message: 'Got logs of package: ' + PACKAGE_NAME,
        result: logs
    })
  }
}


module.exports = createLogPackage
