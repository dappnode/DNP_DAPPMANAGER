const getPath = require('./getPath');
const parse = require('./parse');
const generateDefault = require('./generate');
const fsDefault = require('fs');
const validateDefault = require('./validate');
const createRestartPatch = require('./createRestartPatch');
const logUI = require('./logUI');
const {docker: dockerDefault} = require('./Docker');
const logs = require('../logs.js')(module);

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

function downloadFactory({params,
  ipfsCalls,
  generate = generateDefault,
  validate = validateDefault,
  fs = fsDefault}) {
  return async function download({pkg, logId}) {
    // call IPFS, store the file in the repo's folder
    // load the image to docker
    const PACKAGE_NAME = pkg.name;
    const MANIFEST = pkg.manifest;
    const IMAGE_NAME = parse.manifest.imageName(MANIFEST);
    const IMAGE_HASH = parse.manifest.imageHash(MANIFEST);
    const IMAGE_SIZE = parse.manifest.imageSize(MANIFEST);

    // isCORE?
    const isCORE = (MANIFEST.type == 'dncore' && pkg.allowCORE);
    pkg.isCORE = isCORE;
    // inform the user of improper usage
    if (MANIFEST.type == 'dncore' && !pkg.allowCORE) {
      throw Error('Requesting to install an unverified dncore package');
    }

    // Generate paths
    const MANIFEST_PATH = getPath.manifest(PACKAGE_NAME, params, isCORE);
    const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params, isCORE);
    const IMAGE_PATH = getPath.image(PACKAGE_NAME, IMAGE_NAME, params, isCORE);
    // Validate paths
    validate.path(MANIFEST_PATH);
    validate.path(DOCKERCOMPOSE_PATH);
    validate.path(IMAGE_PATH);
    // Generate files
    const MANIFEST_DATA = generate.manifest(MANIFEST);
    const DOCKERCOMPOSE_DATA = generate.dockerCompose(MANIFEST, params, isCORE);

    // Write manifest and docker-compose
    await fs.writeFileSync(MANIFEST_PATH, MANIFEST_DATA);
    await fs.writeFileSync(DOCKERCOMPOSE_PATH, DOCKERCOMPOSE_DATA);

    // Image validation
    if (fs.existsSync(IMAGE_PATH)) {
      // Image file exists and is valid -> do nothing
      if (await ipfsCalls.isfileHashValid(IMAGE_HASH, IMAGE_PATH)) return;
      // Image file exists and NOT valid -> delete and re-download
      else {
        logs.warn('Previously downloaded image was defective and will be re-downloaded');
        await fs.unlinkSync(IMAGE_PATH);
      }
    }

    // download and load image to docker
    const displayRes = 2;
    const round = (x) => displayRes*Math.ceil(100*x/IMAGE_SIZE/displayRes);
    const _log = (percent) =>
      logUI({logId, pkg: PACKAGE_NAME, msg: 'Downloading... '+percent+' %'});

    logUI({logId, pkg: PACKAGE_NAME, msg: 'starting download...'});
    await ipfsCalls.download(
      validate.path(IMAGE_PATH),
      IMAGE_HASH,
      _log,
      round
    );
  };
}


function runFactory({params,
  docker = dockerDefault,
  }) {
  // patch to prevent installer from crashing
  const restartPatch = createRestartPatch(params, docker);

  return async function run({pkg, logId}) {
    const PACKAGE_NAME = pkg.name;
    const MANIFEST = pkg.manifest;
    const isCORE = pkg.isCORE;
    const VERSION = parse.manifest.version(MANIFEST);
    const IMAGE_NAME = parse.manifest.imageName(MANIFEST);
    const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params, isCORE);
    const IMAGE_PATH = getPath.image(PACKAGE_NAME, IMAGE_NAME, params, isCORE);

    for (const port of getPorts(MANIFEST)) {
      logUI({logId, pkg: PACKAGE_NAME, msg: 'opening port '+port});
      try {
        await docker.openPort(port);
      } catch (e) {
        logUI({logId, pkg: PACKAGE_NAME, msg: 'Error openning port '+port+' '
          +(e ? e.message : '')});
      }
    }

    logUI({logId, pkg: PACKAGE_NAME, msg: 'loading image'});
    await docker.load(IMAGE_PATH);
    logUI({logId, pkg: PACKAGE_NAME, msg: 'loaded image'});

    logUI({logId, pkg: PACKAGE_NAME, msg: 'starting package... '});
    // patch to prevent installer from crashing
    if (PACKAGE_NAME == 'dappmanager.dnp.dappnode.eth') {
      await restartPatch(PACKAGE_NAME+':'+VERSION);
    } else {
      await docker.compose.up(DOCKERCOMPOSE_PATH);
    }
    logUI({logId, pkg: PACKAGE_NAME, msg: 'package started'});
  };
}

function getPorts(MANIFEST) {
  return (MANIFEST && MANIFEST.image && MANIFEST.image.ports)
  ? MANIFEST.image.ports.map((p) => p.split(':')[0])
  : [];
}

module.exports = {
  downloadFactory,
  runFactory,
};
