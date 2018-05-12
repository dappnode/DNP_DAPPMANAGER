const { Docker_Compose } = require('../modules/calls/dockerCalls')
const fs = require('fs')
// writeEnvs

const params = require('../params')
const REPO_DIR = params.REPO_DIR
const DOCKERCOMPOSE_NAME = params.DOCKERCOMPOSE_NAME

async function updatePackageEnv(req) {

    let packageName = req[0]
    let dockerComposePath = REPO_DIR + packageName + '/' + DOCKERCOMPOSE_NAME
    if (!fs.existsSync(dockerComposePath)) {
      throw Error('No docker-compose found with at: ' + dockerComposePath)
    }

    console.log('Removing package: ' + packageName)
    await docker_compose.down(dockerComposePath)

    return JSON.stringify({
        success: true,
        message: 'Removed package: ' + packageName
    })
}


async function writeEnvs(packageReq, envs) {
  let dnpManifest = await getManifest(packageReq.req)
  let path = getPaths (dnpManifest)
  let PACKAGE_REPO_DIR = REPO_DIR + dnpManifest.name
}

module.exports = updatePackageEnv
