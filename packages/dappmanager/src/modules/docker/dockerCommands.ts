import semver from "semver";
import { DockerOptionsInterface } from "../../types";
import shell from "../../utils/shell";
import { imagesList, imageRemove } from "./dockerApi";

/* eslint-disable no-useless-escape */
export interface DockerComposeUpOptions {
  noStart?: boolean;
}

export function dockerComposeUp(
  dcPath: string,
  options?: DockerComposeUpOptions
): Promise<string> {
  const flags = options && options.noStart ? "--no-start" : "-d";
  // Adding <&- to prevent interactive mode
  return shell(`docker-compose -f ${dcPath} up ${flags} <&-`);
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

/**
 * Clean old semver tagged images for DNP `name` expect tag `version`.
 * If the images were removed successfuly the dappmanger will print logs:
 * Untagged: package.dnp.dappnode.eth:0.1.6
 */
export async function dockerCleanOldImages(
  name: string,
  version: string
): Promise<void> {
  const repoImages = await imagesList({ filters: { reference: [name] } });
  const imagesToDelete = repoImages.filter(image =>
    image.RepoTags.every(tag => {
      const [imageName, imageVersion] = tag.split(":");
      return (
        imageName === name &&
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
