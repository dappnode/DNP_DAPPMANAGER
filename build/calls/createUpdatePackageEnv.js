const { Docker_Compose } = require('../modules/calls/dockerCalls')
const { stringifyEnvs } = require('../utils/parse')
const getPath = require('../utils/getPath')
const fsUtils = require('../utils/fs')
const fs = require('fs')


// default option passed to allow testing
function createUpdatePackageEnv(params, docker_compose=docker_compose_default) {

  return async function updatePackageEnv(req) {

    const PACKAGE_NAME = req[0]
    const DOCKERCOMPOSE_PATH = getPath.DOCKERCOMPOSE(PACKAGE_NAME, params)
    const ENV_FILE_PATH = getPath.ENV_FILE(PACKAGE_NAME, params)
    const envs = JSON.parse(req[1])

    let path = utils.getPathsByName(PACKAGE_NAME)

    if (!fs.existsSync(DOCKERCOMPOSE_PATH)) {
      throw Error('No docker-compose found with at: ' + DOCKERCOMPOSE_PATH)
    }

    // Write envs
    await fs.writeFileSync(
      ENV_FILE_PATH,
      stringifyEnvs(envs))

    console.log('Reseting package: ' + PACKAGE_NAME)
    await docker_compose.down(DOCKERCOMPOSE_PATH)
    await docker_compose.up(DOCKERCOMPOSE_PATH)

    return JSON.stringify({
        success: true,
        message: 'Updated envs for package: ' + PACKAGE_NAME
    })
  }

}



module.exports = createUpdatePackageEnv
