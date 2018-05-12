const { Docker_Compose } = require('../modules/calls/dockerCalls')
const docker_compose = new Docker_Compose()
const params = require('../params')

const REPO_DIR = params.REPO_DIR
const DOCKERCOMPOSE_NAME = params.DOCKERCOMPOSE_NAME

async function logPackage(req) {

    let packageName = req[0]
    let dockerComposePath = REPO_DIR + packageName + '/' + DOCKERCOMPOSE_NAME

    console.log('LOGGING...')
    let logs = await docker_compose.logs(dockerComposePath)
    console.log('LOGGED')
    return JSON.stringify({
        success: true,
        message: 'Got logs of package: ' + packageName,
        result: logs
    })
}


module.exports = logPackage
