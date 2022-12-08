import { docker } from "./docker";
import { stripDockerApiLogsHeaderAndAnsi } from "../utils";

/**
 * Returns container's logs as a string with escape codes
 * @param containerNameOrId
 */
export async function logContainer(
  containerNameOrId: string,
  options?: LogOptions
): Promise<string> {
  const container = docker.getContainer(containerNameOrId);
  const res = await container.logs({ stdout: true, stderr: true, ...options });
  // Return is incorrectly typed as NodeJS.ReadableStream, but it's string
  const data = (res as unknown as string) || "";

  // Remove prepended bytes added to each line by the docker API
  return stripDockerApiLogsHeaderAndAnsi(data.toString());
}

export interface LogOptions {
  // Return logs from stdout
  stdout?: boolean;
  // Return logs from stderr
  stderr?: boolean;
  // Add timestamps to every log line
  timestamps?: boolean;
  // Only return this number of log lines from the end of the logs.
  // Specify as an integer or all to output all log lines. Default "all"
  tail?: number;
  // Only return logs since this time, as a UNIX timestamp. Default 0
  since?: number;
  // Only return logs before this time, as a UNIX timestamp. Default 0
  until?: number;
}
