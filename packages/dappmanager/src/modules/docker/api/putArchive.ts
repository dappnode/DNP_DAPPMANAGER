import { docker } from "./docker.js";
import tar from "tar-stream";

/**
 * Upload a tar archive to be extracted to a path in the filesystem of container id.
 * Both if the container is not found of the path is not existant,
 * a 404 error will be returned
 *
 * @param containerNameOrId "DAppNodePackage-geth.dnp.dappnode.eth"
 * @param rootTarPath Path at which the tar should be dumped. Paths inside the tar are relative
 * to this path. It must exist before putArchive
 * @param file The input stream must be a tar archive compressed with one of the
 * following algorithms: identity (no compression), gzip, bzip2, xz.
 * - If typeof file === "string", uses fs.createReadableStream(file)
 */
export async function dockerPutArchive(
  containerNameOrId: string,
  rootTarPath: string,
  file: Buffer | NodeJS.ReadableStream,
  options?: DockerPutArchiveOptions
): Promise<void> {
  const container = docker.getContainer(containerNameOrId);
  await container.putArchive(file, {
    path: rootTarPath,
    noOverwriteDirNonDir: options?.noOverwriteDirNonDir
  });
}

/**
 * Upload single file to container at an absolute path `filePathAbsolute`
 * Creates a tar with the file and streams it to the docker HTTP API
 * @param containerNameOrId "DAppNodePackage-geth.dnp.dappnode.eth"
 * @param filePathAbsolute "/a/b/c/sample.yaml"
 * @param fileContents `Buffer.from("config: true")`
 */
export async function dockerPutArchiveSingleFile(
  containerNameOrId: string,
  filePathAbsolute: string,
  fileContents: string | Buffer
): Promise<void> {
  const pack = tar.pack();

  pack.entry({ name: filePathAbsolute }, fileContents);
  pack.finalize();

  await dockerPutArchive(containerNameOrId, "/", pack);
}

interface DockerPutArchiveOptions {
  /**
   * If “1”, “true”, or “True” then it will be an error if unpacking
   * the given content would cause an existing directory to be replaced
   * with a non-directory and vice versa.
   */
  noOverwriteDirNonDir?: boolean;
}
