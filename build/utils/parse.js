

function parseEnvFile(envFileData) {

  let res = {}
  // Parses key1=value1 files, splited by new line
  //        key2=value2
  envFileData
    .split('\n')
    .filter(row => row.length > 0 )
    .map(row => {
      res[row.split('=')[0]] = row.split('=')[1]
    })

  return res

}

function stringifyEnvs(envs) {

  return Object.getOwnPropertyNames(envs)
    .map((envName) => {
      let envValue = envs[envName]
      return envName + '=' + envValue
    })
    .join('\n')

}


function parsePackageReq(req) {

  let packageName = req.split('@')[0]
  let version = req.split('@')[1] || 'latest'

  return {
    name: packageName,
    ver: version,
    req: packageName + '@' + version
  }
}


module.exports = {
  parseEnvFile,
  stringifyEnvs,
  parsePackageReq
}
