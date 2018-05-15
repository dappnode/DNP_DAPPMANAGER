const getPath = require('../utils/getPath')
// packageList should be an array of package objects, i.e.
// [
//   {
//     name: 'packageA',
//     ver: 'latest'
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


function createDownload(params, ipfsCalls, getManifest, generate, fs) {

  return async function download(pkg) {
    // call IPFS, store the file in the repo's folder
    // load the image to docker

    const PACKAGE_NAME = pkg.name
    const dnpManifest = await getManifest(PACKAGE_NAME)

    const IMAGE_NAME = dnpManifest.image.path
    const IMAGE_HASH = dnpManifest.image.hash
    const MANIFEST_PATH = getPath.MANIFEST(PACKAGE_NAME, params)
    const DOCKERCOMPOSE_PATH = getPath.DOCKERCOMPOSE(PACKAGE_NAME, params)
    const IMAGE_PATH = getPath.IMAGE(PACKAGE_NAME, IMAGE_NAME, params)

    // Write manifest and docker-compose
    await fs.writeFileSync(generate.Manifest(dnpManifest), MANIFEST_PATH)
    await fs.writeFileSync(generate.DockerCompose(dnpManifest), DOCKERCOMPOSE_PATH)

    // Image validation
    if (fs.existsSync(IMAGE_PATH)) {
      // Image file exists and is valid -> do nothing
      if (await ipfsCalls.isfileHashValid(IMAGE_HASH, IMAGE_PATH)) return
      // Image file exists and NOT valid -> delete and re-download
      else await fs.unlinkSync(IMAGE_PATH)
    }

    // download and load image to docker
    await ipfsCalls.download(IMAGE_HASH, IMAGE_PATH)

  }
}


function createRun(params, getManifest, dockerCalls, docker_compose) {

  return async function run(pkg) {

    const PACKAGE_NAME = pkg.name
    const dnpManifest = await getManifest(PACKAGE_NAME)
    const IMAGE_NAME = dnpManifest.image.path
    const DOCKERCOMPOSE_PATH = getPath.DOCKERCOMPOSE(PACKAGE_NAME, params)
    const IMAGE_PATH = getPath.IMAGE(PACKAGE_NAME, IMAGE_NAME, params)

    await dockerCalls.loadImage(IMAGE_PATH)
    await docker_compose.up(DOCKERCOMPOSE_PATH)

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
