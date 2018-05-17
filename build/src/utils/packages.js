const getPath = require('./getPath')
const parse = require('./parse')
const generate_default = require('./generate')
const fs_default = require('fs')
const validate_default = require('./validate')

// packageList should be an array of package objects, i.e.
// [
//   {
//     name: 'packageA',
//     ver: 'latest',
//     dep: <dep object>,
//     manifest: <manifest object>
//   },
//   ...
// ]

function createDownloadPackages(download) {
  return async function downloadPackages(packageList) {
    return await runInParalel(packageList, download)
  }
}


function createRunPackages(run) {
  return async function runPackages(packageList) {
    return await runInSerie(packageList, run)
  }
}


function createDownload(params,
  ipfsCalls,
  dockerCompose,
  log = () => {},
  generate = generate_default,
  validate = validate_default,
  fs = fs_default) {

  return async function download(pkg) {
    // call IPFS, store the file in the repo's folder
    // load the image to docker
    const PACKAGE_NAME = pkg.name
    const MANIFEST = pkg.manifest
    const IMAGE_NAME = parse.manifest.IMAGE_NAME(MANIFEST)
    const IMAGE_HASH = parse.manifest.IMAGE_HASH(MANIFEST)
    const IMAGE_SIZE = parse.manifest.IMAGE_SIZE(MANIFEST)
    const MANIFEST_PATH = getPath.MANIFEST(PACKAGE_NAME, params)
    const DOCKERCOMPOSE_PATH = getPath.DOCKERCOMPOSE(PACKAGE_NAME, params)
    const IMAGE_PATH = getPath.IMAGE(PACKAGE_NAME, IMAGE_NAME, params)

    // Write manifest and docker-compose
    await fs.writeFileSync(
      validate.path(MANIFEST_PATH),
      generate.manifest(MANIFEST))
    await fs.writeFileSync(
      validate.path(DOCKERCOMPOSE_PATH),
      generate.dockerCompose(MANIFEST, params))

    // Image validation
    if (fs.existsSync(IMAGE_PATH)) {
      // Image file exists and is valid -> do nothing
      if (await ipfsCalls.isfileHashValid(IMAGE_HASH, IMAGE_PATH)) return
      // Image file exists and NOT valid -> delete and re-download
      else {
        console.trace('Previously downloaded image was defective and will be re-downloaded')
        await fs.unlinkSync(IMAGE_PATH)
      }
    }

    // download and load image to docker
    const displayRes = 2
    const round = x => displayRes*Math.ceil(100*x/IMAGE_SIZE/displayRes)
    const _log = percent => log({pkg: PACKAGE_NAME, msg: 'Downloading... '+percent+' %'})

    log({pkg: PACKAGE_NAME, msg: 'starting download...'})
    await ipfsCalls.download(
      validate.path(IMAGE_PATH),
      IMAGE_HASH,
      _log,
      round
    )
    log({pkg: PACKAGE_NAME, msg: 'loading image'})
    await dockerCompose.loadImage(IMAGE_PATH)
    log({pkg: PACKAGE_NAME, msg: 'loaded image'})
  }
}


function createRun(params,
  dockerCompose,
  log = () => {}) {

  return async function run(pkg) {

    const PACKAGE_NAME = pkg.name
    const MANIFEST = pkg.manifest
    const IMAGE_NAME = parse.manifest.IMAGE_NAME(MANIFEST)
    const DOCKERCOMPOSE_PATH = getPath.DOCKERCOMPOSE(PACKAGE_NAME, params)
    const IMAGE_PATH = getPath.IMAGE(PACKAGE_NAME, IMAGE_NAME, params)

    log({pkg: PACKAGE_NAME, msg: 'starting package... '})
    await dockerCompose.up(DOCKERCOMPOSE_PATH)
    log({pkg: PACKAGE_NAME, msg: 'package started'})

  }
}


async function runInParalel(array, asyncFunction) {
  return await Promise.all(array.map(asyncFunction))
}


async function runInSerie(array, asyncFunction) {
  let res = []
  for (const [i, element] of array.entries()) {
    res[i] = await asyncFunction(element)
  }
  return res
}


module.exports = {
  createDownload,
  createDownloadPackages,
  createRun,
  createRunPackages,
  runInSerie,
  runInParalel
}
