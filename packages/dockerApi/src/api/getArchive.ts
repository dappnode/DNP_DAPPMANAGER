import { docker } from "./docker.js";
import path from "path";
import tar from "tar-stream";
import { promisify } from "util";
import { Writable, pipeline } from "stream";

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

/**
 * Extracts a single file from a tar stream and pipes its contents
 * to a Writable stream
 */
export async function tarExtractSingleFile(
  tarReadableStream: NodeJS.ReadableStream,
  fileContentSink: Writable,
  targetFile: string
): Promise<void> {
  const extract = tar.extract();

  return new Promise((resolve, reject) => {
    let fileFound = false;

    extract.on("entry", async function(header, stream, next) {
      if (!fileFound && header.name === targetFile && header.type === "file") {
        fileFound = true;

        try {
          await promisify(pipeline)(stream, fileContentSink);
        } catch (e) {
          extract.destroy();
          reject(e);
        } finally {
          next();
        }
      } else {
        // just auto drain the stream, to prevent too much backpressure
        stream.on("end", () => next());
        stream.resume();
      }
    });

    extract.on("finish", function() {
      if (fileFound) resolve();
      else reject(Error(`file ${targetFile} not found in tar`));
    });

    extract.on("error", (e) => reject(e));

    tarReadableStream.pipe(extract);
  });
}
