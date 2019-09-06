import path from "path";
import fs from "fs";
// Modules
import docker from "../modules/docker";
import listContainers from "../modules/listContainers";
// Utils
import shell from "../utils/shell";
import fileToDataUri from "../utils/fileToDataUri";
import params from "../params";
import { RpcHandlerReturn } from "../types";

interface RpcCopyFileToReturn extends RpcHandlerReturn {
  result: string;
}

const maxSizeKb = 10e3;
const tempTransferDir = params.TEMP_TRANSFER_DIR;

/**
 * Copy file from a DNP and downloaded on the client
 *
 * @param {string} id DNP .eth name
 * @param {string} fromPath path to copy file from
 * - If path = path to a file: "/usr/src/app/config.json".
 *   Downloads and sends that file
 * - If path = path to a directory: "/usr/src/app".
 *   Downloads all directory contents, tar them and send as a .tar.gz
 * - If path = relative path: "config.json".
 *   Path becomes $WORKDIR/config.json, then downloads and sends that file
 *   Same for relative paths to directories.
 * @returns {string} dataUri = "data:application/zip;base64,UEsDBBQAAAg..."
 */
export default async function copyFileFrom({
  id,
  fromPath
}: {
  id: string;
  fromPath: string;
}): Promise<RpcCopyFileToReturn> {
  if (!id) throw Error("Argument id must be defined");
  if (!fromPath) throw Error("Argument fromPath must be defined");

  // Get container name
  const dnpList = await listContainers();
  const dnp = dnpList.find(p => p.name === id);
  if (!dnp) throw Error(`No DNP found for id ${id}`);
  const containerName = dnp.packageName;

  // Construct relative paths to container
  // Fetch the WORKDIR from a docker inspect
  if (!path.isAbsolute(fromPath)) {
    // workingDir = "/usr/src/app"
    let workingDir = await docker.getContainerWorkingDir(containerName);
    workingDir = (workingDir || "/").replace(/['"]+/g, "");
    fromPath = path.join(workingDir, fromPath);
  }

  /**
   * Intermediate step, the file is in local file system
   *
   * Get the file extension so fileToDataUri can find the correct mime type
   * path.parse("config.json").base -> `"config.json"`
   * path.parse("config").base      -> `"config"`
   * path.parse("app/").base        -> `"app"`
   */
  await shell(`mkdir -p ${tempTransferDir}`); // Never throws
  const { base } = path.parse(fromPath);
  let toPath = path.join(tempTransferDir, base);

  // Copy file from container to local file system
  await docker.copyFileFrom(containerName, fromPath, toPath);

  /**
   * Allow directories by automatically compressing them to .tar.gz files
   * 1. Test if directory
   * 2. Compress (use stripTrailingSlash to clean path, just in case)
   * 3. Clean original files and rename toPath variable
   *
   * [TODO-IDEA]
   * How to check the size and path characteristics with docker exec:
   * - `docker exec ${container} test -f ${path}` returns if file or throws
   * - `docker exec ${container} test -d ${path}` returns if directory or throws
   * - `docker exec ${container} du -sb ${path}` returns bytes
   */

  if (fs.lstatSync(toPath).isDirectory()) {
    /**
     * Limit max file size until a DAppNode <-> client transport method is adopted
     * $ du -s -k app/file.gz
     * 12 app/file.gz
     */
    const dirSizeKb = await getFileOrDirSize(toPath);
    if (dirSizeKb > 200e3) {
      await shell(`rm -rf ${toPath}`);
      throw Error(
        `Dir file transfers > ${maxSizeKb} KB are not allowed. Attempting ${dirSizeKb} KB`
      );
    }
    // Use node.js util to get the file / dir name safely
    const toPathCompressed = `${toPath}.zip`;
    /**
     * To preserve the folder's relative structure while calling zip from a different dir
     * Ref: https://unix.stackexchange.com/a/77616
     * `(cd test/npm-test && zip -r - .) > npm-test.zip`
     */
    await shell(`(cd ${toPath} && zip -r - .) > ${toPathCompressed}`);
    await shell(`rm -rf ${toPath}`);
    toPath = toPathCompressed;
  }

  /**
   * Limit max file size until a DAppNode <-> client transport method is adopted
   * $ du -s -k app/file.gz
   * 12 app/file.gz
   */
  const fileSizeKb = await getFileOrDirSize(toPath);
  if (fileSizeKb > 20e3) {
    await shell(`rm -rf ${toPath}`);
    throw Error(
      `File transfers > ${maxSizeKb} KB are not allowed. Attempting ${fileSizeKb} KB`
    );
  }

  /**
   * Converts a file to data URI.
   * Path must have an extension for the mime type to be processed properly.
   * If there is no extension, the MIME type will be:
   * - application/octet-stream, which is defined as "arbitrary binary data"
   * When the browser receives that MIME type it means:
   * - "I don't know what the hell this is. Please save it as a file"
   *
   * [NOTE] does not support directories, it will throw an error:
   *   Error: EISDIR: illegal operation on a directory, read
   *
   * @param {object} path file path, will read the file at this path
   * @returns {string} data URI: data:application/zip;base64,UEsDBBQAAAg...
   */
  const dataUri = await fileToDataUri(toPath);

  // Clean intermediate file
  await shell(`rm -rf ${toPath}`);

  return {
    message: `Copied file from ${id} ${fromPath}`,
    logMessage: true,
    userAction: true,
    result: dataUri
  };
}

// Utility

/**
 * Limit max file size until a DAppNode <-> client transport method is adopted
 * $ du -s -k app/file.gz
 * 12 app/file.gz
 * @param {string} path "app/file.gz"
 * @returns {string} size in KB "12"
 */
async function getFileOrDirSize(path: string): Promise<number> {
  const output = await shell(`du -s -k ${path}`);
  const sizeString = output
    .trim()
    .replace(/\t/g, " ")
    .split(" ")[0];
  return parseInt(sizeString || "0");
}
