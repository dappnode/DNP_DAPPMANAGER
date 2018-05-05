// node modules
const fs = require('fs')

// dedicated modules
const params = require('../params')
const emitter = require('./emitter')
const ipfsCalls = require('./calls/ipfsCalls')
const getManifest = require('./getManifest')
const generateDockerCompose = require('./generateDockerCompose')
const dockerCalls = require('./calls/dockerCalls')

// Define paths
const REPO_DIR = params.REPO_DIR
const DAPPNODE_PACKAGE_NAME = params.DAPPNODE_PACKAGE_NAME
const DOCKERCOMPOSE_NAME = params.DOCKERCOMPOSE_NAME

function getPaths (dnpManifest) {
  let PACKAGE_REPO_DIR = REPO_DIR + dnpManifest.name
  let MANIFEST = PACKAGE_REPO_DIR + '/' + DAPPNODE_PACKAGE_NAME
  let DOCKERCOMPOSE = PACKAGE_REPO_DIR + '/' + DOCKERCOMPOSE_NAME
  let IMAGE = PACKAGE_REPO_DIR + '/' + dnpManifest.image.path
  return {
    PACKAGE_REPO_DIR,
    MANIFEST,
    DOCKERCOMPOSE,
    IMAGE
  }
}

async function download(packageName) {

  // Initialize variables
  let dnpManifest = await getManifest(packageName)
  let path = getPaths (dnpManifest)

  // Create de Global repo dir
  if (!fs.existsSync(REPO_DIR)) {
      fs.mkdirSync(REPO_DIR)
  }

  // Create de repo dir
  if (!fs.existsSync(path.PACKAGE_REPO_DIR)) {
      fs.mkdirSync(path.PACKAGE_REPO_DIR)
  }

  // Write manifest
  if (!fs.existsSync(path.MANIFEST)) {
      await writeManifest(dnpManifest, path.MANIFEST)
  }

  // Write docker-compose
  await writeDockerCompose(dnpManifest, path.DOCKERCOMPOSE)

  // Write image
  if (!fs.existsSync(path.IMAGE)) {

    emitter.emit('log', {
      topic: packageName,
      msg: "Starting download..."
    })

      await ipfsCalls.download(dnpManifest.image.hash, path.IMAGE, function(msg) {
        emitter.emit('log', {
          topic: packageName,
          msg: msg
        })
      })

  } else {

    // Verify that the downloaded image is equal to the requested,
    // by comparing their hashes
    if (await ipfsCalls.isfileHashValid(dnpManifest.image.hash, path.IMAGE)) {
      emitter.emit('log', {
        topic: packageName,
        msg: 'Image loaded from cache'
      })
    } else {
      emitter.emit('log', {
        topic: packageName,
        msg: 'Redownloading image, cached image has a wrong hash, path: '+path.IMAGE
      })
      await deleteFile(path.IMAGE)
      await ipfsCalls.download(dnpManifest.image.hash, path.IMAGE)
    }

  }
}

async function deleteFile(path) {
  return new Promise(function(resolve, reject) {
    fs.unlink(path, (err) => {
      if (err) throw err
      console.log('DELETED ' + path)
      resolve()
    })
  })
}

async function load(packageName) {

  let dnpManifest = await getManifest(packageName)
  let path = getPaths(dnpManifest)

  emitter.emit('log', {
    topic: packageName,
    msg: 'Loading docker image...'
  })

  await dockerCalls.loadImage(path.IMAGE)

  emitter.emit('log', {
    topic: packageName,
    type: 'success',
    msg: "Image loaded"
  })

}

async function run(packageName) {

  let dnpManifest = await getManifest(packageName)
  let path = getPaths (dnpManifest)

  emitter.emit('log', {
    topic: packageName,
    msg: 'Running docker image...'
  })

  await dockerCalls.dockerComposeUp(path.DOCKERCOMPOSE)

  emitter.emit('log', {
    topic: packageName,
    type: 'success',
    msg: 'Image started'
  })

}

async function writeDockerCompose(dnpManifest, path) {
    let dockerCompose = generateDockerCompose(dnpManifest)
    await writeFile(dockerCompose, path)
}

async function writeManifest(dnpManifest, path) {
    let data = JSON.stringify(dnpManifest, null, 2)
    await writeFile(data, path)
}

function writeFile(data, path) {
    return new Promise(function(resolve, reject) {
        fs.writeFile(path, data, 'utf-8', function(err) {
            if (err) {
                return reject(err)
            }
            return resolve()
        })
    })
}



module.exports = {
  download,
  load,
  run,
}
