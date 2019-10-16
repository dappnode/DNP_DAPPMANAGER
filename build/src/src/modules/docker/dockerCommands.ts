import semver from "semver";
import { DockerOptionsInterface } from "../../types";
import shell from "./shell";

/* eslint-disable no-useless-escape */

export function dockerComposeUp(dcPath: string): Promise<string> {
  return shell(`docker-compose -f ${dcPath} up -d`);
}

export function dockerComposeDown(
  dcPath: string,
  options?: { volumes?: boolean; timeout?: number }
): Promise<string> {
  return shell(withOptions(`docker-compose -f ${dcPath} down`, options || {}));
}

export function dockerComposeRm(dcPath: string): Promise<string> {
  return shell(`docker-compose -f ${dcPath} rm -sf`);
}

export function dockerComposeStart(dcPath: string): Promise<string> {
  return shell(withOptions(`docker-compose -f ${dcPath} start`, {}));
}

export function dockerComposeStop(
  dcPath: string,
  options?: { timeout?: number }
): Promise<string> {
  return shell(withOptions(`docker-compose -f ${dcPath} stop`, options || {}));
}

export function dockerComposeConfig(dcPath: string): Promise<string> {
  return shell(`docker-compose -f ${dcPath} config`);
}

export function dockerVolumeRm(volumeName: string): Promise<string> {
  return shell(`docker volume rm -f ${volumeName}`);
}

export function dockerRm(
  containerNameOrId: string,
  options?: { volumes?: boolean }
): Promise<string> {
  const flags = (options || {}).volumes ? "--volumes" : "";
  return shell(`docker rm -f ${flags} ${containerNameOrId}`);
}

export function dockerLoad(imagePath: string): Promise<string> {
  return shell(`docker load -i ${imagePath}`);
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

export function dockerImages(): Promise<string> {
  return shell(`docker images --format "{{.Repository}}:{{.Tag}}"`);
}

export function dockerRmi(imgsToDelete: string[]): Promise<string> {
  return shell(`docker rmi ${imgsToDelete.join(" ")}`);
}

/**
 * Clean old semver tagged images for DNP `name` expect tag `version`.
 * If the images were removed successfuly the dappmanger will print logs:
 * Untagged: package.dnp.dappnode.eth:0.1.6
 */
export async function dockerCleanOldImages(
  name: string,
  version: string
): Promise<void> {
  const currentImgs = await dockerImages();
  const oldImages = (currentImgs || "").split(/\r|\n/).filter((p: string) => {
    const [pName, pVer] = p.split(":");
    return pName === name && semver.valid(pVer) && pVer !== version;
  });
  if (oldImages.length > 0) await dockerRmi(oldImages);
}

export function dockerLogs(
  containerNameOrId: string,
  options: { timestamps?: boolean; tail?: number }
): Promise<string> {
  // Parse options
  let optionsString = "";
  // --timeout TIMEOUT      Specify a shutdown timeout in seconds (default: 10).
  if (options && options.timestamps) optionsString += " --timestamps";
  if (options && options.tail && !isNaN(options.tail))
    optionsString += ` --tail ${options.tail}`;
  return shell(`docker logs ${containerNameOrId} ${optionsString} 2>&1`);
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

/**
 * Wrapper for parseOptions. Will only extend the command string if necessary
 * @param {string} command
 * @param {object} options
 */
function withOptions(command: string, options: DockerOptionsInterface): string {
  return [command, parseOptions(options)].filter(x => x).join(" ");
}

function parseOptions({
  timeout,
  timestamps,
  volumes,
  v,
  core
}: DockerOptionsInterface): string {
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
