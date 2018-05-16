const { containerStateFromPs } = require('../utils/dockerUtils')
const DockerCompose = require('../utils/DockerCompose')
const fs = require('fs')
const getPath = require('../utils/getPath')


function createTogglePackage(params,
  // default option passed to allow testing
  dockerCompose) {

  return async function togglePackage(req) {

      const PACKAGE_NAME = req[0]
      const timeout = req[1] || 10
      const DOCKERCOMPOSE_PATH = getPath.DOCKERCOMPOSE(PACKAGE_NAME, params)

      if (!fs.existsSync(DOCKERCOMPOSE_PATH)) {
        throw Error('No docker-compose found with at: ' + DOCKERCOMPOSE_PATH)
      }

      let packageState = containerStateFromPs(
        await dockerCompose.ps(DOCKERCOMPOSE_PATH),
        PACKAGE_NAME
      )

      // docker-compose states my contain extra info, i.e. Exit (137), Up (healthy)
      switch (packageState.split(' ')[0]) {

        case 'Up':
          await dockerCompose.stop(DOCKERCOMPOSE_PATH, {timeout})
          break;

        case 'Exit':
          await dockerCompose.start(DOCKERCOMPOSE_PATH)
          break;

        case 'Down':
          console.log('{{{{{{{{{{{}}}}}}}}}}}')
          console.log(packageState)
          console.trace(await dockerCompose.ps(DOCKERCOMPOSE_PATH))
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
