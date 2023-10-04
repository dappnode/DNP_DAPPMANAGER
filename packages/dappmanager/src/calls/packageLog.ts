import { logContainer } from "@dappnode/dockerapi";

/**
 * Returns the logs of the docker container of a package
 */
export async function packageLog({
  containerName,
  options
}: {
  containerName: string;
  options?: { timestamps?: boolean; tail?: number };
}): Promise<string> {
  if (!containerName) throw Error("kwarg containerName must be defined");

  return await logContainer(containerName, options);
}
