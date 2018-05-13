const { containerStateFromPs } = require('../modules/calls/dockerCallsUtils')
const { Docker_compose } = require('../modules/calls/dockerCalls')
const fs = require('fs')
const getPath = require('../utils/getPath')
const docker_compose_default = new Docker_compose()


function createTogglePackage(params,
  // default option passed to allow testing
  docker_compose=docker_compose_default) {

  return async function togglePackage(req) {

      const PACKAGE_NAME = req[0]
      const DOCKERCOMPOSE_PATH = getPath.DOCKERCOMPOSE(PACKAGE_NAME, params)

      if (!fs.existsSync(DOCKERCOMPOSE_PATH)) {
        throw Error('No docker-compose found with at: ' + DOCKERCOMPOSE_PATH)
      }

      let packageState = containerStateFromPs(
        await docker_compose.ps(DOCKERCOMPOSE_PATH),
        PACKAGE_NAME
      )

      // docker-compose states my contain extra info, i.e. Exit (137), Up (healthy)
      switch (packageState.split(' ')[0]) {

        case 'Up':
          await docker_compose.stop(DOCKERCOMPOSE_PATH)
          break;

        case 'Exit':
          await docker_compose.start(DOCKERCOMPOSE_PATH)
          break;

        case 'Down':
          throw Error('Package ' + PACKAGE_NAME + ' is down, state: ' + packageState)
          break;

        default:
          throw Error('Unkown state: ' + packageState + ', for package: ' + PACKAGE_NAME)
      }
      return JSON.stringify({
          success: true,
          message: 'successfully toggled package'
      })
  }

}


module.exports = createTogglePackage
