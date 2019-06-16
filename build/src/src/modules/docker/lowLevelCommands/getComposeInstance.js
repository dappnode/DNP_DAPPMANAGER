const fs = require("fs");
const params = require("params");
const getPath = require("utils/getPath");
const shell = require("utils/shell");

/**
 * Gets a docker-compose instance
 * @param {string} id "bitcoin.dnp.dappnode.eth"
 */
function getComposeInstance(id, { isPath } = {}) {
  const composePath = isPath ? id : getPath.dockerComposeSmart(id, params);
  if (!fs.existsSync(composePath))
    throw Error(`Compose for ${id} not found at ${composePath}`);

  return {
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
    up: () => shell(`docker-compose -f ${composePath} up -d --force-recreate`),

    // Usage: down [options]
    // Options:
    // --rmi type              Remove images. Type must be one of:
    //                           'all': Remove all images used by any service.
    //                           'local': Remove only images that don't have a custom tag.
    // -v, --volumes           Remove named volumes declared in the `volumes`
    // --remove-orphans        Remove containers for services not defined in the Compose file
    // -t, --timeout TIMEOUT   Specify a shutdown timeout in seconds. (default: 10)
    down: ({ volumes }) =>
      shell(
        `docker-compose -f ${composePath} down ${volumes ? "--volumes" : ""}`
      ),

    // Usage: restart [options] [SERVICE...]
    // Options:
    // -t, --timeout TIMEOUT      Specify a shutdown timeout in seconds. (default: 10)
    rm: () => shell(`docker-compose -f ${composePath} rm -sf`)
  };
}

module.exports = getComposeInstance;
