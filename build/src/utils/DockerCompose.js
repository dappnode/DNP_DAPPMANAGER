// node modules
const { promisify } = require('util');
const shellSync = require('./shell')
const fs = require('fs')
const docker = require('docker-remote-api')
const request = docker()


class DockerCompose {
  constructor() {
    this.exec = shellSync
  }

  setExec(exec) {
    this.exec = exec
  }

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

  up(dockerComposePath) {
    return this.exec('docker-compose -f ' + dockerComposePath + ' up -d')
  }

  // Usage: down [options]
  // Options:
  //     --rmi type              Remove images. Type must be one of:
  //                               'all': Remove all images used by any service.
  //                               'local': Remove only images that don't have a custom tag set by the `image` field.
  //     -v, --volumes           Remove named volumes declared in the `volumes`
  //     --remove-orphans        Remove containers for services not defined in the Compose file
  //     -t, --timeout TIMEOUT   Specify a shutdown timeout in seconds. (default: 10)
  down(dockerComposePath, options={}) {
    let optionsString = parseOptions(options)
    return this.exec('docker-compose -f ' + dockerComposePath + ' down'+optionsString)
  }

  // Usage: start [SERVICE...]
  start(dockerComposePath) {
    return this.exec('docker-compose -f ' + dockerComposePath + ' start')
  }

  // Usage: stop [options] [SERVICE...]
  // Options:
  // -t, --timeout TIMEOUT      Specify a shutdown timeout in seconds (default: 10).
  stop(dockerComposePath, options={}) {
    let optionsString = parseOptions(options)
    return this.exec('docker-compose -f ' + dockerComposePath + ' stop'+optionsString)
  }

  // Usage: logs [options] [SERVICE...]
  // Options:
  // --no-color          Produce monochrome output.
  // -f, --follow        Follow log output
  // -t, --timestamps    Show timestamps
  // --tail="all"        Number of lines to show from the end of the logs
  //                     for each container.
  logs(dockerComposePath, options={}) {
    let optionsString = parseOptions(options)
    return this.exec('docker-compose -f ' + dockerComposePath + ' logs'+optionsString)
  }

  // Usage: ps [options] [SERVICE...]
  // Options:
  // -q    Only display IDs
  ps(dockerComposePath) {
    return this.exec('docker-compose -f ' + dockerComposePath + ' ps')
  }

  // NOT A DOCKER-COMPOSE
  // Usage: docker load [OPTIONS]
  // --input , -i		Read from tar archive file, instead of STDIN
  // --quiet , -q		Suppress the load output
  loadImage(imagePath) {
    return this.exec('docker load -i ' + imagePath)
  }

}


function parseOptions(options) {
  let optionsString = ''

  // --timeout TIMEOUT      Specify a shutdown timeout in seconds (default: 10).
  if (Number.isInteger(options.timeout)) optionsString += ' --timeout '+options.timeout
  // -t, --timestamps    Show timestamps
  if (options.timestamps) optionsString += ' --timestamps'

  return optionsString
}



module.exports = DockerCompose
