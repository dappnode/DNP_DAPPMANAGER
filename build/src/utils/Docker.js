// node modules
const { promisify } = require('util');
const shellSync_default = require('./shell')
const fs = require('fs')
const docker = require('docker-remote-api')
const request = docker()


function createDocker(shellSync = shellSync_default) {

  return {
    compose: {
      // Usage: up [options] [--scale SERVICE=NUM...] [SERVICE...]
      // Options:
      // -d, --detach               Detached mode: Run containers in the background, print new container names.
      // --no-color                 Produce monochrome output.
      // --no-deps                  Don't start linked services.
      // --force-recreate           Recreate containers even if their configuration and image haven't changed.
      // --always-recreate-deps     Recreate dependent containers. Incompatible with --no-recreate.
      // --no-recreate              If containers already exist, don't recreate them. Incompatible with --force-recreate and -V.
      // --no-build                 Don't build an image, even if it's missing.
      // --no-start                 Don't start the services after creating them.
      // --build                    Build images before starting containers.
      // --exit-code-from SERVICE   Return the exit code of the selected service
      //                            container. Implies --abort-on-container-exit.
      up: (DOCKERCOMPOSE_PATH, options={}) => {
        let optionsString = parseOptions(options)
        return shellSync('docker-compose -f ' + DOCKERCOMPOSE_PATH + ' up -d'+optionsString)
      },

      // Usage: down [options]
      // Options:
      //     --rmi type              Remove images. Type must be one of:
      //                               'all': Remove all images used by any service.
      //                               'local': Remove only images that don't have a custom tag set by the `image` field.
      //     -v, --volumes           Remove named volumes declared in the `volumes`
      //     --remove-orphans        Remove containers for services not defined in the Compose file
      //     -t, --timeout TIMEOUT   Specify a shutdown timeout in seconds. (default: 10)
      down: (DOCKERCOMPOSE_PATH, options={}) => {
        let optionsString = parseOptions(options)
        return shellSync('docker-compose -f ' + DOCKERCOMPOSE_PATH + ' down'+optionsString)
      },

      // Usage: start [SERVICE...]
      start: (DOCKERCOMPOSE_PATH, options={}) => {
        let optionsString = parseOptions(options)
        return shellSync('docker-compose -f ' + DOCKERCOMPOSE_PATH + ' start'+optionsString)
      },

      // Usage: stop [options] [SERVICE...]
      // Options:
      // -t, --timeout TIMEOUT      Specify a shutdown timeout in seconds (default: 10).
      stop: (DOCKERCOMPOSE_PATH, options={}) => {
        let optionsString = parseOptions(options)
        return shellSync('docker-compose -f ' + DOCKERCOMPOSE_PATH + ' stop'+optionsString)
      },

      // Usage: restart [options] [SERVICE...]
      // Options:
      // -t, --timeout TIMEOUT      Specify a shutdown timeout in seconds. (default: 10)
      rm: (DOCKERCOMPOSE_PATH, options={}) => {
        let optionsString = parseOptions(options)
        return shellSync('docker-compose -f ' + DOCKERCOMPOSE_PATH + ' rm -sf'+optionsString)
      },

      // Usage: restart [options] [SERVICE...]
      // Options:
      // -t, --timeout TIMEOUT      Specify a shutdown timeout in seconds. (default: 10)
      restart: (DOCKERCOMPOSE_PATH, options={}) => {
        let optionsString = parseOptions(options)
        return shellSync('docker-compose -f ' + DOCKERCOMPOSE_PATH + ' restart'+optionsString)
      },

      // Usage: logs [options] [SERVICE...]
      // Options:
      // --no-color          Produce monochrome output.
      // -f, --follow        Follow log output
      // -t, --timestamps    Show timestamps
      // --tail="all"        Number of lines to show from the end of the logs
      //                     for each container.
      logs: (DOCKERCOMPOSE_PATH, options={}) => {
        let optionsString = parseOptions(options)
        return shellSync('docker-compose -f ' + DOCKERCOMPOSE_PATH + ' logs'+optionsString)
      },

      // Usage: ps [options] [SERVICE...]
      // Options:
      // -q    Only display IDs
      ps: (DOCKERCOMPOSE_PATH) => {
        return shellSync('docker-compose -f ' + DOCKERCOMPOSE_PATH + ' ps')
      }

    },

    volume: {
      // docker volume rm [OPTIONS] VOLUME [VOLUME...]
      // --force , -f  Force the removal of one or more volumes
      rm: (VOLUME) => {
        return shellSync('docker volume rm -f ' + VOLUME)
      }
    },

    // NOT A DOCKER-COMPOSE
    // Usage: docker load [OPTIONS]
    // --input , -i		Read from tar archive file, instead of STDIN
    // --quiet , -q		Suppress the load output
    load: (imagePath) => {
      return shellSync('docker load -i ' + imagePath)
    },

    // NOT A DOCKER-COMPOSE
    // Usage: docker logs [OPTIONS] CONTAINER
    // --timestamps , -t  Show timestamps
    log: (containerNameOrId) => {
      return shellSync('docker logs ' + containerNameOrId)
    }


  }

}



function parseOptions(options) {
  let optionsString = ''

  // --timeout TIMEOUT      Specify a shutdown timeout in seconds (default: 10).
  if (Number.isInteger(options.timeout)) optionsString += ' --timeout '+options.timeout
  // -t, --timestamps    Show timestamps
  if (options.timestamps) optionsString += ' --timestamps'
  if (options.volumes) optionsString += ' --volumes'
  if (options.v) optionsString += ' -v'
  if (options.core) optionsString += (' ' + options.core)

  return optionsString
}



module.exports = createDocker
