/**
 * Converts a data URI feeded from the server to a downloadable blob
 *
 * @param {string} dataURI = data:application/zip;base64,UEsDBBQAAAg...
 * @returns {Blob} ready to be used with "file-saver"
 *   import { saveAs } from "file-saver";
 *   const blob = dataUriToBlob(fileContent);
 *   saveAs(blob, file.name);
 */
export default function dataUriToBlob(dataURI: string): Blob {
  if (!dataURI || typeof dataURI !== "string")
    throw Error("dataUri must be a string");

  // Credit: https://stackoverflow.com/questions/12168909/blob-from-dataurl
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
  const byteString = atob(dataURI.split(",")[1]);
  // separate out the mime component
  // dataURI = data:application/zip;base64,UEsDBBQAAAg...
  const mimeString = dataURI
    .split(",")[0]
    .split(":")[1]
    .split(";")[0];
  // write the bytes of the string to an ArrayBuffer
  const ab = new ArrayBuffer(byteString.length);
  // create a view into the buffer
  const ia = new Uint8Array(ab);
  // set the bytes of the buffer to the correct values
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  // write the ArrayBuffer to a blob, and you're done
  const blob = new Blob([ab], { type: mimeString });
  return blob;
}
