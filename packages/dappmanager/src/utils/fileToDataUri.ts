import fs from "fs";
import mime from "mime-types";

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
 * @param path file path, will read the file at this path
 * @returns data URI: data:application/zip;base64,UEsDBBQAAAg...
 */
export default async function fileToDataUri(path: string): Promise<string> {
  const base64 = await fs.promises.readFile(path, { encoding: "base64" });

  /**
   * mimer is not able to process .tar.gz correctly,
   * Correct it to the correct MIME type: "application/gzip"
   */
  const mimetype = path.endsWith(".tar.gz")
    ? "application/gzip"
    : mime.lookup(path) || "application/octet-stream";

  return `data:${mimetype};base64,${base64}`;
}
