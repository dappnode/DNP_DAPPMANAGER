import { docker } from "./docker.js";
import path from "path";
import { Writable } from "stream";
import { tarExtractSingleFile } from "../../../utils/tarExtractSingleFile.js";

/**
 * Get a tar archive of a resource in the filesystem of container id.
 *
 * Both if the container is not found of the path is not existant,
 * a 404 error will be returned
 *
 * @param containerNameOrId "DAppNodePackage-geth.dnp.dappnode.eth"
 * @param rootTarPath Path to tar
 */
export async function dockerGetArchive(
  containerNameOrId: string,
  rootTarPath: string
): Promise<NodeJS.ReadableStream> {
  const container = docker.getContainer(containerNameOrId);
  const readableStream = await container.getArchive({ path: rootTarPath });

  return readableStream;
}

/**
 * Get a single file from container at an absolute path `filePathAbsolute`
 * Gets and extracts a tar with the file from the docker HTTP API
 * @param containerNameOrId "DAppNodePackage-geth.dnp.dappnode.eth"
 * @param filePathAbsolute "/a/b/c/sample.yaml"
 */
export async function dockerGetArchiveSingleFile(
  containerNameOrId: string,
  filePathAbsolute: string,
  fileContentSink: Writable
): Promise<void> {
  const tarReadableStream = await dockerGetArchive(
    containerNameOrId,
    filePathAbsolute
  );

  const targetFile = path.parse(filePathAbsolute).base;
  await tarExtractSingleFile(tarReadableStream, fileContentSink, targetFile);
}
