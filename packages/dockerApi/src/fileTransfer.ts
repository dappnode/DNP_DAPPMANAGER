import path from "path";
import { promisify } from "util";
import { Writable, pipeline } from "stream";
import { dockerGetArchive, dockerGetArchiveSingleFile } from "./api/index.js";

/**
 * Returns a tar or a file based on the path extension
 * - If has any extension it's considered a file
 * - If has no extension it's considered a directory
 * @param containerNameOrId "DAppNodePackage-geth.dnp.dappnode.eth"
 * @param filePathAbsolute "/a/b/c/sample.yaml"
 * @param fileContentSink
 */
export async function dockerGetFileOrDirBasedOnExtension(
  containerNameOrId: string,
  filePathAbsolute: string,
  fileContentSink: Writable,
  options?: { isSingleFile: boolean }
): Promise<void> {
  if (options?.isSingleFile) {
    // Download single file
    await dockerGetArchiveSingleFile(containerNameOrId, filePathAbsolute, fileContentSink);
  } else {
    // Download path as tar
    const tarReadableStream = await dockerGetArchive(containerNameOrId, filePathAbsolute);
    await promisify(pipeline)(tarReadableStream, fileContentSink);
  }
}

type FileType = "file" | "directory";

export async function dockerGetPathType(filePathAbsolute: string): Promise<FileType> {
  if (path.parse(filePathAbsolute).ext) {
    return "file";
  } else {
    return "directory";
  }
}
