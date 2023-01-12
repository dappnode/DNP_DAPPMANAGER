import fs from "fs";
import dataUriToBuffer from "data-uri-to-buffer";

/**
 * Converts a data URI feeded from the server to a downloadable blob
 *
 * @param dataUri = data:application/zip;base64,UEsDBBQAAAg...
 * @param pathTo = DNCORE/tempfile
 */
export default function dataUriToFile(dataUri: string, pathTo: string): void {
  const decodedBuffer = dataUriToBuffer(dataUri);
  fs.writeFileSync(pathTo, decodedBuffer);
}
