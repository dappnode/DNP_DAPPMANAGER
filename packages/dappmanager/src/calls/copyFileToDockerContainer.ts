import { copyFileToDockerContainer as _copyFileToDockerContainer } from "@dappnode/dockerapi";

/**
 * Copy file to a DNP:
 *
 * @param containerName Name of a docker container
 * @param dataUri = "data:application/zip;base64,UEsDBBQAAAg..."
 * @param filename name of the uploaded file.
 * - MUST NOT be a path: "/app", "app/", "app/file.txt"
 * @param toPath path to copy a file to
 * - If path = path to a file: "/usr/src/app/config.json".
 *   Copies the contents of dataUri to that file, overwritting it if necessary
 * - If path = path to a directory: "/usr/src/app".
 *   Copies the contents of dataUri to ${dir}/${filename}
 * - If path = relative path: "config.json".
 *   Path becomes $WORKDIR/config.json, then copies the contents of dataUri there
 *   Same for relative paths to directories.
 * - If empty, defaults to $WORKDIR
 */
export async function copyFileToDockerContainer({
  containerName,
  dataUri,
  filename,
  toPath
}: {
  containerName: string;
  dataUri: string;
  filename: string;
  toPath: string;
}): Promise<void> {
  await _copyFileToDockerContainer({
    containerName,
    dataUri,
    filename,
    toPath
  });
}
