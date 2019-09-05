import shell from "./shell";

/* eslint-disable no-useless-escape */

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
    up: (dcPath: string, options?: OptionsInterface) =>
      shell(withOptions(`docker-compose -f ${dcPath} up -d`, options || {})),

    // Usage: down [options]
    // Options:
    //     --rmi type              Remove images. Type must be one of:
    //                               'all': Remove all images used by any service.
    //                               'local': Remove only images that don't have a custom tag.
    //     -v, --volumes           Remove named volumes declared in the `volumes`
    //     --remove-orphans        Remove containers for services not defined in the Compose file
    //     -t, --timeout TIMEOUT   Specify a shutdown timeout in seconds. (default: 10)
    down: (dcPath: string, options?: OptionsInterface) =>
      shell(withOptions(`docker-compose -f ${dcPath} down`, options || {})),

    // Usage: start [SERVICE...]
    start: (dcPath: string, options?: OptionsInterface) =>
      shell(withOptions(`docker-compose -f ${dcPath} start`, options || {})),

    // Usage: stop [options] [SERVICE...]
    // Options:
    // -t, --timeout TIMEOUT      Specify a shutdown timeout in seconds (default: 10).
    stop: (dcPath: string, options?: OptionsInterface) =>
      shell(withOptions(`docker-compose -f ${dcPath} stop`, options || {})),

    // Usage: restart [options] [SERVICE...]
    // Options:
    // -t, --timeout TIMEOUT      Specify a shutdown timeout in seconds. (default: 10)
    rm: (dcPath: string, options?: OptionsInterface) =>
      shell(withOptions(`docker-compose -f ${dcPath} rm -sf`, options || {})),

    // Usage: restart [options] [SERVICE...]
    // Options:
    // -t, --timeout TIMEOUT      Specify a shutdown timeout in seconds. (default: 10)
    restart: (dcPath: string, options?: OptionsInterface) =>
      shell(withOptions(`docker-compose -f ${dcPath} restart`, options || {})),

    // Usage: logs [options] [SERVICE...]
    // Options:
    // --no-color          Produce monochrome output.
    // -f, --follow        Follow log output
    // -t, --timestamps    Show timestamps
    // --tail="all"        Number of lines to show from the end of the logs
    //                     for each container.
    logs: (dcPath: string, options?: OptionsInterface) =>
      shell(
        withOptions(`docker-compose -f ${dcPath} logs`, options || {}) + " 2>&1"
      ),

    // Usage: ps [options] [SERVICE...]
    // Options:
    // -q    Only display IDs
    ps: (dcPath: string) => shell(`docker-compose -f ${dcPath} ps`)
  },

  volume: {
    // docker volume rm [OPTIONS] VOLUME [VOLUME...]
    // --force , -f  Force the removal of one or more volumes
    rm: (volumeName: string) => shell(`docker volume rm -f ${volumeName}`)
  },

  // SPECIAL OPERATION
  // Searches for semver
  images: () => shell(`docker images --format "{{.Repository}}:{{.Tag}}"`),

  rmi: (imgsToDelete: string[]) =>
    shell(`docker rmi ${imgsToDelete.join(" ")}`),

  rmOldSemverImages: (packageName: string) =>
    shell(
      `docker rmi $(docker images --format "{{.Repository}}:{{.Tag}}" | grep "${packageName}:[0-9]\+.[0-9]\+.[0-9]\+")`
    ),

  // NOT A DOCKER-COMPOSE
  // Usage: docker load [OPTIONS]
  // --input , -i		Read from tar archive file, instead of STDIN
  // --quiet , -q		Suppress the load output
  load: (imagePath: string) => shell(`docker load -i ${imagePath}`),

  // NOT A DOCKER-COMPOSE
  // Usage: docker tag SOURCE_IMAGE[:TAG] TARGET_IMAGE[:TAG]
  tag: (sourceImage: string, targetImage: string) =>
    shell(`docker tag ${sourceImage} ${targetImage}`),

  // NOT A DOCKER-COMPOSE
  // Usage: docker logs [OPTIONS] CONTAINER
  // --timestamps , -t  Show timestamps
  log: (
    containerNameOrId: string,
    options: { timestamps: boolean; tail: number }
  ) => {
    // Parse options
    let optionsString = "";
    // --timeout TIMEOUT      Specify a shutdown timeout in seconds (default: 10).
    if (options && options.timestamps) optionsString += " --timestamps";
    if (options && !isNaN(options.tail))
      optionsString += ` --tail ${options.tail}`;
    return shell(`docker logs ${containerNameOrId} ${optionsString} 2>&1`);
  },

  // NOT A DOCKER-COMPOSE
  // Usage: docker system df [OPTIONS]
  // --verbose , -v		Show detailed information on space usage
  systemDf: () => shell("docker system df --verbose"),

  // File manager, copy command
  copyFileFrom: (id: string, fromPath: string, toPath: string) =>
    shell(`docker cp --follow-link ${id}:${fromPath} ${toPath}`),

  copyFileTo: (id: string, fromPath: string, toPath: string) =>
    shell(`docker cp --follow-link ${fromPath} ${id}:${toPath}`),

  // Metadata getters
  getContainerWorkingDir: (id: string) =>
    shell(`docker inspect --format='{{json .Config.WorkingDir}}' ${id}`)
};

/**
 * Wrapper for parseOptions. Will only extend the command string if necessary
 * @param {string} command
 * @param {object} options
 */
function withOptions(command: string, options: OptionsInterface) {
  return [command, parseOptions(options)].filter(x => x).join(" ");
}

interface OptionsInterface {
  timeout?: number;
  timestamps?: boolean;
  volumes?: boolean;
  v?: boolean;
  core?: string;
}

function parseOptions({
  timeout,
  timestamps,
  volumes,
  v,
  core
}: OptionsInterface) {
  const options = [];

  // --timeout TIMEOUT      Specify a shutdown timeout in seconds (default: 10).
  if (!isNaN(Number(timeout))) options.push(`--timeout ${timeout}`);
  // -t, --timestamps    Show timestamps
  if (timestamps) options.push(`--timestamps`);
  if (volumes) options.push(`--volumes`);
  if (v) options.push(`-v`);
  if (core) options.push(`${core}`);

  return options.join(" ");
}

export default docker;
