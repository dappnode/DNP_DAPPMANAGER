const { Docker_Compose } = require('../modules/calls/dockerCalls')
const docker_compose = new Docker_Compose()
const fs = require('fs')

const params = require('../params')
const REPO_DIR = params.REPO_DIR
const DOCKERCOMPOSE_NAME = params.DOCKERCOMPOSE_NAME

async function removePackage(req) {

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


module.exports = removePackage
