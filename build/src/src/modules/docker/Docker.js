// node modules
let shell = require('./shell');

const docker = {
  compose: {
    // Usage: up [options] [--scale SERVICE=NUM...] [SERVICE...]
    // Options:
    // -d, --detach               Detached mode: Run containers in the background.
    // --no-color                 Produce monochrome output.
    // --no-deps                  Don't start linked services.
    // --force-recreate           Recreate containers with configuration / image unchanged.
    // --always-recreate-deps     Recreate dependent containers. Incompatible with --no-recreate.
    // --no-recreate              If containers already exist, don't recreate them.
    // --no-build                 Don't build an image, even if it's missing.
    // --no-start                 Don't start the services after creating them.
    // --build                    Build images before starting containers.
    // --exit-code-from SERVICE   Return the exit code of the selected service
    //                            container. Implies --abort-on-container-exit.
    up: (DOCKERCOMPOSE_PATH, options={}) => {
      let optionsString = parseOptions(options);
      return shell('docker-compose -f ' + DOCKERCOMPOSE_PATH + ' up -d'+optionsString);
    },

    // Usage: down [options]
    // Options:
    //     --rmi type              Remove images. Type must be one of:
    //                               'all': Remove all images used by any service.
    //                               'local': Remove only images that don't have a custom tag.
    //     -v, --volumes           Remove named volumes declared in the `volumes`
    //     --remove-orphans        Remove containers for services not defined in the Compose file
    //     -t, --timeout TIMEOUT   Specify a shutdown timeout in seconds. (default: 10)
    down: (DOCKERCOMPOSE_PATH, options={}) => {
      let optionsString = parseOptions(options);
      return shell('docker-compose -f ' + DOCKERCOMPOSE_PATH + ' down'+optionsString);
    },

    // Usage: start [SERVICE...]
    start: (DOCKERCOMPOSE_PATH, options={}) => {
      let optionsString = parseOptions(options);
      return shell('docker-compose -f ' + DOCKERCOMPOSE_PATH + ' start'+optionsString);
    },

    // Usage: stop [options] [SERVICE...]
    // Options:
    // -t, --timeout TIMEOUT      Specify a shutdown timeout in seconds (default: 10).
    stop: (DOCKERCOMPOSE_PATH, options={}) => {
      let optionsString = parseOptions(options);
      return shell('docker-compose -f ' + DOCKERCOMPOSE_PATH + ' stop'+optionsString);
    },

    // Usage: restart [options] [SERVICE...]
    // Options:
    // -t, --timeout TIMEOUT      Specify a shutdown timeout in seconds. (default: 10)
    rm: (DOCKERCOMPOSE_PATH, options={}) => {
      let optionsString = parseOptions(options);
      return shell('docker-compose -f ' + DOCKERCOMPOSE_PATH + ' rm -sf'+optionsString);
    },

    // Safe down & up
    rm_up: (DOCKERCOMPOSE_PATH, options={}) => {
      let optionsString = parseOptions(options);
      return shell('docker-compose -f ' + DOCKERCOMPOSE_PATH + ' rm -sf'+optionsString
      +' && docker-compose -f ' + DOCKERCOMPOSE_PATH + ' up -d'+optionsString);
    },

    // Usage: restart [options] [SERVICE...]
    // Options:
    // -t, --timeout TIMEOUT      Specify a shutdown timeout in seconds. (default: 10)
    restart: (DOCKERCOMPOSE_PATH, options={}) => {
      let optionsString = parseOptions(options);
      return shell('docker-compose -f ' + DOCKERCOMPOSE_PATH + ' restart'+optionsString);
    },

    // Usage: logs [options] [SERVICE...]
    // Options:
    // --no-color          Produce monochrome output.
    // -f, --follow        Follow log output
    // -t, --timestamps    Show timestamps
    // --tail="all"        Number of lines to show from the end of the logs
    //                     for each container.
    logs: (DOCKERCOMPOSE_PATH, options={}) => {
      let optionsString = parseOptions(options);
      return shell('docker-compose -f ' + DOCKERCOMPOSE_PATH
        + ' logs'+optionsString + ' 2>&1', true);
    },

    // Usage: ps [options] [SERVICE...]
    // Options:
    // -q    Only display IDs
    ps: (DOCKERCOMPOSE_PATH) => {
      return shell('docker-compose -f ' + DOCKERCOMPOSE_PATH + ' ps');
    },

  },

  volume: {
    // docker volume rm [OPTIONS] VOLUME [VOLUME...]
    // --force , -f  Force the removal of one or more volumes
    rm: (VOLUME) => {
      return shell('docker volume rm -f ' + VOLUME);
    },
  },

  // SPECIAL OPERATION
  // Searches for semver
  /* eslint-disable no-useless-escape *//* eslint-disable max-len */
  images: () => {
    return shell(`docker images --format "{{.Repository}}:{{.Tag}}"`, true);
  },
  rmi: (imgsToDelete) => {
    return shell(`docker rmi ${imgsToDelete.join(' ')}`);
  },
  rmOldSemverImages: (packageName) => {
    return shell(`docker rmi $(docker images --format "{{.Repository}}:{{.Tag}}" | grep "${packageName}:[0-9]\+.[0-9]\+.[0-9]\+")`);
  },
  /* eslint-enable no-useless-escape *//* eslint-enable max-len */

  // NOT A DOCKER-COMPOSE
  // Usage: docker load [OPTIONS]
  // --input , -i		Read from tar archive file, instead of STDIN
  // --quiet , -q		Suppress the load output
  load: (imagePath) => {
    return shell('docker load -i ' + imagePath);
  },

  // NOT A DOCKER-COMPOSE
  // Usage: docker tag SOURCE_IMAGE[:TAG] TARGET_IMAGE[:TAG]
  tag: (sourceImage, targetImage) => {
    return shell('docker tag ' + sourceImage + ' ' + targetImage);
  },

  // NOT A DOCKER-COMPOSE
  // Usage: docker logs [OPTIONS] CONTAINER
  // --timestamps , -t  Show timestamps
  log: (containerNameOrId, options = {}) => {
    // Parse options
    let optionsString = '';
    // --timeout TIMEOUT      Specify a shutdown timeout in seconds (default: 10).
    if (
      options.hasOwnProperty('timestamps')
      && options.timestamps
    ) optionsString += ' --timestamps';

    if (
      options.hasOwnProperty('tail')
      && !isNaN(options.tail)
    ) optionsString += ' --tail '+options.tail;

    return shell('docker logs ' + containerNameOrId+' '+optionsString+' 2>&1', true);
  },

  // NOT A DOCKER-COMPOSE
  // Usage: docker system df [OPTIONS]
  // --verbose , -v		Show detailed information on space usage
  systemDf: () => {
    return shell('docker system df --verbose');
  },

  status: (containerNameOrId) => {
    return shell('docker inspect --format=\'{{.State.Status}}\' ' + containerNameOrId, true);
  },

  // NOT A DOCKER, DOCKER-COMPOSE
  // Custom command to open and close ports
  openPort: async (port) => {
    const IMAGE = await shell(getVpnImageCmd());
    return await shell(getUpnpCmd(port, 'open', IMAGE));
  },
  closePort: async (port) => {
    const IMAGE = await shell(getVpnImageCmd());
    return await shell(getUpnpCmd(port, 'close', IMAGE));
  },
  isUpnpAvailable: async () => {
    const IMAGE = await shell(getVpnImageCmd());
    return await shell('docker run --rm --net=host '
      +IMAGE+' upnpc -l | awk -F\'= \'  \'/ExternalIPAddress/{print $2}\'')
    .then((res) => (res && res.includes('.')), (err) => false);
  },
};

function getVpnImageCmd() {
  return 'docker inspect DAppNodeCore-vpn.dnp.dappnode.eth -f \'{{.Config.Image}}\'';
}

/**
 *
 * @param {String} port Must be in the format port = {
 *   number: 30303,
 *   type: TCP
 * }
 * @param {String} type
 * @param {String} IMAGE
 * @return {String}
 */
function getUpnpCmd(port = {}, type, IMAGE) {
  if (typeof port !== 'object') {
    throw Error(`port must be an object: port = { number: 30303, type: 'UDP' }`);
  }
  if (!port.number) {
    throw Error(`port must container a number property: port = { number: 30303, type: 'UDP' }`);
  }
  let flag;
  if (type === 'open') flag = '-r';
  if (type === 'close') flag = '-d';
  /* eslint-disable max-len */
  return `docker run --rm --net=host ${IMAGE.trim()} upnpc -e DAppNode ${flag} ${port.number} ${port.type || 'TCP'}`;
  /* eslint-enable max-len */
}

function parseOptions(options) {
  let optionsString = '';

  // --timeout TIMEOUT      Specify a shutdown timeout in seconds (default: 10).
  if (!isNaN(options.timeout)) optionsString += ' --timeout '+options.timeout;
  // -t, --timestamps    Show timestamps
  if (options.timestamps) optionsString += ' --timestamps';
  if (options.volumes) optionsString += ' --volumes';
  if (options.v) optionsString += ' -v';
  if (options.core) optionsString += (' ' + options.core);

  return optionsString;
}


module.exports = docker;
