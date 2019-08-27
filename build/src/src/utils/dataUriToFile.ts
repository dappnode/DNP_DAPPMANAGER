import fs from "fs";
const dataUriToBuffer = require("data-uri-to-buffer");

/**
 * Converts a data URI feeded from the server to a downloadable blob
 *
 * @param {string} dataUri = data:application/zip;base64,UEsDBBQAAAg...
 * @param {string} pathTo = DNCORE/tempfile
 */
export default function dataUriToFile(dataUri: string, pathTo: string) {
  const decodedBuffer = dataUriToBuffer(dataUri);
  fs.writeFileSync(pathTo, decodedBuffer);
}
