import dargs from "dargs";
import { shell } from "@dappnode/utils";

type Kwargs = { [flag: string]: string | number | boolean | undefined };

function parseKwargs(kwargs?: Kwargs): string[] {
  const definedKwargs = (kwargs || {}) as Parameters<typeof dargs>[0];
  return dargs(definedKwargs, { useEquals: false, ignoreFalse: true });
}

async function execDockerCompose(
  dcPath: string,
  subcommand: string,
  kwargs?: Kwargs,
  serviceNames?: string[]
): Promise<string> {
  // Usage: subcommand [options] [--scale SERVICE=NUM...] [SERVICE...]
  return shell([
    "docker compose",
    "-f",
    dcPath,
    subcommand,
    ...parseKwargs(kwargs),
    // service names MUST go after the options
    ...(serviceNames || []),
    // Adding <&- to prevent interactive mode
    "<&-"
  ]);
}

export interface DockerComposeUpOptions {
  noStart?: boolean;
  detach?: boolean;
  forceRecreate?: boolean;
  timeout?: number;
  serviceNames?: string[];
  removeOrphans?: boolean;
}

export function dockerComposeUp(dcPath: string, options: DockerComposeUpOptions = {}): Promise<string> {
  // --detach is invalid with --no-start
  if (options.noStart) options.detach = false;
  return execDockerCompose(
    dcPath,
    "up",
    {
      noStart: options.noStart,
      detach: options.detach ?? true,
      forceRecreate: options.forceRecreate,
      timeout: options.timeout,
      removeOrphans: options.removeOrphans
    },
    options.serviceNames
  );
}

/**
 * --volumes           Remove named volumes declared in the `volumes`s.
 * --timeout TIMEOUT   Specify a shutdown timeout in seconds.
 */
export function dockerComposeDown(
  dcPath: string,
  options: { volumes?: boolean; timeout?: number } = {}
): Promise<string> {
  return execDockerCompose(dcPath, "down", options);
}

/**
 * Removes all containers from a compose project
 * --force   Don't ask to confirm removal
 * --stop    Stop the containers, if required, before removing
 * @param dcPath
 */
export function dockerComposeRm(dcPath: string): Promise<string> {
  return execDockerCompose(dcPath, "rm", { force: true, stop: true });
}

export function dockerComposeStart(dcPath: string): Promise<string> {
  return execDockerCompose(dcPath, "start");
}

/**
 * --timeout TIMEOUT   Specify a shutdown timeout in seconds.
 */
export function dockerComposeStop(dcPath: string, options: { timeout?: number } = {}): Promise<string> {
  return execDockerCompose(dcPath, "stop", options);
}

export function dockerComposeConfig(dcPath: string): Promise<string> {
  return execDockerCompose(dcPath, "config");
}
