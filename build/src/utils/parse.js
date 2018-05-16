

function envFile(envFileData) {

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


function packageReq(req) {

  if (!req) throw Error('PARSE ERROR: packageReq is undefined')
  if (typeof(req) != 'string') throw Error('PARSE ERROR: packageReq must be a string, packageReq: ' + req)
  // Added for debugging on development
  if (req.length == 1) throw Error('WARNING: packageReq has only one character, this should not happen, packageReq: ' + req)

  let name = req.split('@')[0]
  let ver = req.split('@')[1] || 'latest'

  return {
    name,
    ver,
    req: name + '@' + ver
  }
}

// A package manifest has this format:
// {
//   ...
//   "dependencies": {
//     "nginx-proxy.dnp.dappnode.eth": "latest"
//   }
// }

const manifest = {

  depObject: function(manifest) {
    let depObject = manifest.dependencies
    if ( !depObject || typeof(depObject) != typeof({}) ) {
      throw Error('BROKEN DEPENDENCY OBJECT, of package: '+JSON.stringify(packageReq)+' depObject: '+depObject)
    }
    return depObject
  },

  IMAGE_NAME: manifest => manifest.image.path,
  IMAGE_HASH: manifest => manifest.image.hash,
  IMAGE_SIZE: manifest => manifest.image.hash

}


module.exports = {
  envFile,
  stringifyEnvs,
  packageReq,
  manifest
}
