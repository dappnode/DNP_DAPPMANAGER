const fs = require('fs')
const parse =    require('../utils/parse')
const getPath =  require('../utils/getPath')
const validate = require('../utils/validate')
const res =      require('../utils/res')


// default option passed to allow testing
function createUpdatePackageEnv(params, docker) {

  return async function updatePackageEnv(req) {

    const PACKAGE_NAME = parse.packageReq(req[0]).name // parsing anyway for safety
    const DOCKERCOMPOSE_PATH = getPath.DOCKERCOMPOSE(PACKAGE_NAME, params)
    const ENV_FILE_PATH = getPath.ENV_FILE(PACKAGE_NAME, params)
    const envs = JSON.parse(req[1])
    const restart = req[2]

    // Write envs
    await fs.writeFileSync(
      validate.path(ENV_FILE_PATH),
      parse.stringifyEnvs(envs))

    if (restart) {
      if (!fs.existsSync(DOCKERCOMPOSE_PATH)) {
        throw Error('No docker-compose found with at: ' + DOCKERCOMPOSE_PATH)
      }
      await docker.compose.down(DOCKERCOMPOSE_PATH)
      await docker.compose.up(DOCKERCOMPOSE_PATH)
    }

    return res.success('Updated envs for package: ' + PACKAGE_NAME)

  }

}



module.exports = createUpdatePackageEnv
