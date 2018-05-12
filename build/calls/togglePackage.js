const dockerCalls = require('../modules/calls/dockerCalls')
const { Docker_Compose } = require('../modules/calls/dockerCalls')
const docker_compose = new Docker_Compose()
const fs = require('fs')

const params = require('../params')
const REPO_DIR = params.REPO_DIR
const DOCKERCOMPOSE_NAME = params.DOCKERCOMPOSE_NAME

async function togglePackage(req) {

    let packageName = req[0]
    let dockerComposePath = REPO_DIR + packageName + '/' + DOCKERCOMPOSE_NAME
    if (!fs.existsSync(dockerComposePath)) {
      throw Error('No docker-compose found with at: ' + dockerComposePath)
    }

    let id = req[0]
    let containers = await dockerCalls.listContainers()
    let container = containers.find( container => container.name.includes(packageName) );
    if (!container) {
      throw Error('No package found with name: ' + packageName)
    }
    // The toggle function will:
    // - stop the package if it's running (container.state == 'running')
    // - run the package if it's stopped  (container.state == 'exited')
    // - return and error if it's in any other state
    switch (container.state) {

      case 'running':
        // stop
        console.log('FIRING A STOP!!')
        await docker_compose.stop(dockerComposePath)
        console.log('FIRED A STOP')
        return JSON.stringify({
            success: true,
            message: 'Package stopped'
        })
        break;

      case 'exited':
        // start
        console.log('FIRING A START!!')
        await docker_compose.start(dockerComposePath)
        console.log('FIRED A START')
        return JSON.stringify({
            success: true,
            message: 'Package started'
        })
        break;

      default:
        // unknown status
        return JSON.stringify({
            success: false,
            message: 'Package: '+container.name+' has an unkown status: '+container.state
        })
    }
}


module.exports = togglePackage
