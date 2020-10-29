import semver from "semver";
import dargs from "dargs";
import shell from "../../utils/shell";
import { imagesList, imageRemove } from "./dockerApi";

type Args = string[];
type Kwargs = { [flag: string]: string | number | boolean | undefined };

function parseArgs(args: Args, kwargs?: Kwargs): string[] {
  const definedKwargs = (kwargs || {}) as Parameters<typeof dargs>[0];
  return [
    ...args,
    ...dargs(definedKwargs, { useEquals: false, ignoreFalse: true })
  ];
}

async function execDocker(args: Args, kwargs?: Kwargs): Promise<string> {
  return shell(["docker", ...parseArgs(args, kwargs)]);
}

async function execDockerCompose(
  dcPath: string,
  args: Args,
  kwargs?: Kwargs
): Promise<string> {
  return shell([
    "docker-compose",
    "-f",
    dcPath,
    ...parseArgs(args, kwargs),
    // Adding <&- to prevent interactive mode
    "<&-"
  ]);
}

export function dockerComposeUp(
  dcPath: string,
  options: {
    noStart?: boolean;
    detach?: boolean;
    forceRecreate?: boolean;
    timeout?: number;
    serviceNames?: string[];
  } = {}
): Promise<string> {
  // --detach is invalid with --no-start
  if (options.noStart) options.detach = false;
  return execDockerCompose(dcPath, ["up", ...(options.serviceNames || [])], {
    noStart: options.noStart,
    detach: options.detach ?? true,
    forceRecreate: options.forceRecreate,
    timeout: options.timeout
  });
}

/**
 * --volumes           Remove named volumes declared in the `volumes`s.
 * --timeout TIMEOUT   Specify a shutdown timeout in seconds.
 */
export function dockerComposeDown(
  dcPath: string,
  options: { volumes?: boolean; timeout?: number } = {}
): Promise<string> {
  return execDockerCompose(dcPath, ["down"], options);
}

/**
 * Removes all containers from a compose project
 * --force   Don't ask to confirm removal
 * --stop    Stop the containers, if required, before removing
 * @param dcPath
 */
export function dockerComposeRm(dcPath: string): Promise<string> {
  return execDockerCompose(dcPath, ["rm"], { force: true, stop: true });
}

export function dockerComposeStart(dcPath: string): Promise<string> {
  return execDockerCompose(dcPath, ["start"]);
}

/**
 * --timeout TIMEOUT   Specify a shutdown timeout in seconds.
 */
export function dockerComposeStop(
  dcPath: string,
  options: { timeout?: number } = {}
): Promise<string> {
  return execDockerCompose(dcPath, ["stop"], options);
}

export function dockerComposeConfig(dcPath: string): Promise<string> {
  return execDockerCompose(dcPath, ["config"]);
}

export function dockerVolumeRm(volumeName: string): Promise<string> {
  return execDocker(["volume", "rm", volumeName], { f: true });
}

export function dockerStart(containerNames: string[]): Promise<string> {
  return execDocker(["start", ...containerNames]);
}

export function dockerStop(
  containerNames: string[],
  options: {
    time?: number;
  } = {}
): Promise<string> {
  return execDocker(["stop", ...containerNames], options);
}

export function dockerRm(
  containerName: string,
  { volumes }: { volumes?: boolean } = {}
): Promise<string> {
  return execDocker(["rm", containerName], { force: true, volumes });
}

interface ImageManifest {
  Config: string; // "f949e7d76d63befffc8eec2cbf8a6f509780f96fb3bacbdc24068d594a77f043.json"
  Layers: string[]; // ["14ec119e6215a169a53a8c9cdfb56ca873e10f2e5ea0a37692bfa71601f18ec7/layer.tar"]
  RepoTags: string[]; // ["package.dnp.dappnode.eth:0.2.0"];
}
export function dockerImageManifest(
  imagePath: string
): Promise<ImageManifest[]> {
  return shell(`tar -xOf ${imagePath} manifest.json`).then(JSON.parse);
}

/**
 * Clean old semver tagged images for DNP `name` expect tag `version`.
 * If the images were removed successfuly the dappmanger will print logs:
 * Untagged: package.dnp.dappnode.eth:0.1.6
 */
export async function dockerCleanOldImages(
  dnpName: string,
  version: string
): Promise<void> {
  // Filtering by `reference` requires the repo name to be exact
  // This prevents catching all images of a multi-service package
  const repoImages = await imagesList();
  const imagesToDelete = repoImages.filter(image =>
    image.RepoTags.every(tag => {
      const [imageName, imageVersion] = tag.split(":");
      return (
        (imageName === dnpName ||
          // Get multi-service images, but not mix `goerli-geth` with `goerli` for example
          imageName.endsWith("." + dnpName)) &&
        semver.valid(imageVersion) &&
        semver.valid(version) &&
        semver.lt(imageVersion, version)
      );
    })
  );

  for (const image of imagesToDelete) {
    await imageRemove(image.Id);
  }
}

// File manager, copy command

export function dockerCopyFileTo(
  id: string,
  fromPath: string,
  toPath: string
): Promise<string> {
  return shell(`docker cp --follow-link ${fromPath} ${id}:${toPath}`);
}

export function dockerCopyFileFrom(
  id: string,
  fromPath: string,
  toPath: string
): Promise<string> {
  return shell(`docker cp --follow-link ${id}:${fromPath} ${toPath}`);
}

export function dockerGetContainerWorkingDir(id: string): Promise<string> {
  return shell(`docker inspect --format='{{json .Config.WorkingDir}}' ${id}`);
}
