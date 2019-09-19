import { DockerOptionsInterface } from "../../types";
import shell from "./shell";

/* eslint-disable no-useless-escape */

export function dockerComposeUp(dcPath: string): Promise<string> {
  return shell(`docker-compose -f ${dcPath} up -d`);
}

export function dockerComposeDown(
  dcPath: string,
  volumes = false
): Promise<string> {
  return shell(withOptions(`docker-compose -f ${dcPath} down`, { volumes }));
}

export function dockerComposeRm(dcPath: string): Promise<string> {
  return shell(`docker-compose -f ${dcPath} rm -sf`);
}

export function dockerComposeStart(
  dcPath: string,
  options?: DockerOptionsInterface
): Promise<string> {
  return shell(withOptions(`docker-compose -f ${dcPath} start`, options || {}));
}

export function dockerComposeStop(
  dcPath: string,
  options?: DockerOptionsInterface
): Promise<string> {
  return shell(withOptions(`docker-compose -f ${dcPath} stop`, options || {}));
}

export function dockerVolumeRm(volumeName: string): Promise<string> {
  return shell(`docker volume rm -f ${volumeName}`);
}

export function dockerLoad(imagePath: string): Promise<string> {
  return shell(`docker load -i ${imagePath}`);
}

export function dockerImages(): Promise<string> {
  return shell(`docker images --format "{{.Repository}}:{{.Tag}}"`);
}

export function dockerRmi(imgsToDelete: string[]): Promise<string> {
  return shell(`docker rmi ${imgsToDelete.join(" ")}`);
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
