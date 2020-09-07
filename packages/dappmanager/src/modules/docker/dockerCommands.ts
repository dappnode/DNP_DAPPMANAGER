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
  return shell(["docker-compose", "-f", dcPath, ...parseArgs(args, kwargs)]);
}

export function dockerComposeUp(
  dcPath: string,
  options?: {
    noStart?: boolean;
    forceRecreate?: boolean;
    serviceNames?: string[];
  }
): Promise<string> {
  const flags: string[] = [];
  if (options?.noStart) flags.push("--no-start");
  else flags.push("--detach");
  if (options?.forceRecreate) flags.push("--force-recreate");
  if (options?.serviceNames)
    for (const serviceName of options.serviceNames) flags.push(serviceName);
  // Adding <&- to prevent interactive mode
  return execDockerCompose(dcPath, ["up", ...flags, "<&-"]);
}

/**
 * --volumes           Remove named volumes declared in the `volumes`s.
 * --timeout TIMEOUT   Specify a shutdown timeout in seconds.
 */
export function dockerComposeDown(
  dcPath: string,
  { volumes, timeout }: { volumes?: boolean; timeout?: number } = {}
): Promise<string> {
  return execDockerCompose(dcPath, ["down"], { volumes, timeout });
}

/**
 * Removes all containers from a compose project
 * -f: Don't ask to confirm removal
 * -s: Stop the containers, if required, before removing
 * @param dcPath
 */
export function dockerComposeRm(dcPath: string): Promise<string> {
  return execDockerCompose(dcPath, ["rm", "-sf"]);
}

export function dockerComposeStart(dcPath: string): Promise<string> {
  return execDockerCompose(dcPath, ["start"]);
}

/**
 * --timeout TIMEOUT   Specify a shutdown timeout in seconds.
 */
export function dockerComposeStop(
  dcPath: string,
  { timeout }: { timeout?: number } = {}
): Promise<string> {
  return execDockerCompose(dcPath, ["stop"], { timeout });
}

export function dockerComposeConfig(dcPath: string): Promise<string> {
  return execDockerCompose(dcPath, ["config"]);
}

export function dockerVolumeRm(volumeName: string): Promise<string> {
  return execDocker(["volume", "rm", volumeName], { f: true });
}

export function dockerStart(containerName: string): Promise<string> {
  return execDocker(["start", containerName]);
}

export function dockerStop(
  containerName: string,
  { time }: { time?: number } = {}
): Promise<string> {
  return execDocker(["stop", containerName], { time });
}

export function dockerRm(
  containerName: string,
  { volumes }: { volumes?: boolean } = {}
): Promise<string> {
  return execDocker(["rm", containerName], { force: true, volumes });
}

/**
 * --input , -i		Read from tar archive file, instead of STDIN
 */
export function dockerLoad(imagePath: string): Promise<string> {
  return execDocker(["load"], { input: imagePath });
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
  const repoImages = await imagesList({ filters: { reference: [dnpName] } });
  const imagesToDelete = repoImages.filter(image =>
    image.RepoTags.every(tag => {
      const [imageName, imageVersion] = tag.split(":");
      return (
        imageName.includes(dnpName) &&
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
