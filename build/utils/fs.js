const fs = require('fs')

async function writeEnvs(envs, path) {

  let envNames = Object.getOwnPropertyNames(envs)
  let envFileData = envNames
    .map((envName) => envName + '=' + envs[envName])
    .join('\n')

  await fs.writeFileSync(path, envFileData, 'utf-8')

}

// module.exports = {
//   writeEnvs
// }
