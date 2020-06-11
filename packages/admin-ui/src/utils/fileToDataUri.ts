/**
 * Converts a file object to data URI
 *
 * @param {object} file file object obtained from an <input type="file"/>
 * @returns {string} data URI: data:application/zip;base64,UEsDBBQAAAg...
 */
export default function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = e => {
      // fileContent is a base64 URI = data:application/zip;base64,UEsDBBQAAAg...
      if (!e || !e.target || !e.target.result)
        return reject(Error("e.target fileContent is not defined"));
      const fileContent = e.target.result;
      resolve(
        fileContent instanceof ArrayBuffer
          ? fileContent.toString()
          : fileContent
      );
    };
  });
}
