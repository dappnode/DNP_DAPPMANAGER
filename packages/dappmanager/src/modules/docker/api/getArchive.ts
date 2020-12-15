import { docker } from "./docker";
import tar from "tar-stream";
import path from "path";

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
  filePathAbsolute: string
): Promise<Buffer> {
  const readableStream = await dockerGetArchive(
    containerNameOrId,
    filePathAbsolute
  );

  const extract = tar.extract();

  const targetFile = path.parse(filePathAbsolute).base;

  return new Promise((resolve, reject) => {
    let fileContents: Buffer | null = null;

    extract.on("entry", async function(header, stream, next) {
      // header is the tar header
      // stream is the content body (might be an empty stream)
      // call next when you are done with this entry

      if (header.name === targetFile && header.type === "file") {
        const bufferArr = await all<Buffer>(stream);
        fileContents = Buffer.concat(bufferArr);
      }

      next(); // ready for next entry
    });

    extract.on("finish", function() {
      if (fileContents) {
        resolve(fileContents);
      } else {
        reject(Error(`file ${targetFile} not found in tar`));
      }
    });

    extract.on("error", reject);

    readableStream.pipe(extract);
  });
}

async function all<T>(source: AsyncIterable<T> | Iterable<T>): Promise<T[]> {
  const arr: T[] = [];

  for await (const entry of source) {
    arr.push(entry);
  }

  return arr;
}
