const path = require("path");
const tarToZip = require("tar-to-zip");
const tar = require("tar-stream");
const streams = require("memory-streams");
const getContainerInstance = require("../lowLevelCommands/getContainerInstance");
const getContainerWorkingDir = require("./getContainerWorkingDir");
const getPathInfo = require("./getPathInfo");

/**
 * [NOTE] files are always returned as .tar
 *
 * @param {string} id "bitcoin.dnp.dappnode.eth"
 * @param {string} pathContainer "/temp/config"
 * @returns {buffer} content
 */
async function copyFileFromToBuffer(id, { pathContainer }) {
  const container = await getContainerInstance(id);

  /**
   * - container.putArchive does NOT support relative paths
   *   provide support for relative paths by fetching workingDir
   */
  if (!pathContainer || !path.isAbsolute(pathContainer)) {
    const workingDir = await getContainerWorkingDir(id);
    pathContainer = path.join(workingDir || "/", pathContainer);
  }

  const info = await getPathInfo(id, { pathContainer });

  const readStream = await container.getArchive({ path: pathContainer });
  const writer = new streams.WritableStream();

  if (info.isDirectory) {
    /**
     * [IS-DIRECTORY]
     * - pipe the readStream with a tar to the tar-to-zip
     * - return a buffer containing a raw zip file as a buffer
     */

    tarToZip(readStream)
      .getStream()
      .pipe(writer);

    return await new Promise((resolve, reject) => {
      readStream.on("end", () => {
        resolve(writer.toBuffer());
      });
      readStream.on("error", reject);
    });
  } else {
    /**
     * [SINGLE-FILE]
     *
     */
    const filename = path.parse(pathContainer).base;
    const extract = tar.extract();
    return await new Promise((resolve, reject) => {
      let entryCount = 0;
      function stop(reason) {
        writer.end();
        extract.end();
        return reject(Error(reason));
      }
      extract.on("entry", (header, stream, next) => {
        /**
         * @param {object} header = {
         *   name: "test/1/2/3/",
         *   mode: 16877,
         *   size: 0,
         *   mtime: "2019-06-15T22:07:31.000Z",
         *   type: "directory",
         *   ...
         * };
         *
         * - Only accept de first entry
         * - Must not be a directory
         * - Must be the same filename as requested
         */
        if (header.type === "directory")
          stop(`Path ${pathContainer} must not be a directory`);
        else if (entryCount++ > 1)
          stop(`Path ${pathContainer} is not a single file`);
        else if (header.name !== filename)
          stop(`Path ${pathContainer} has unexpected filename ${header.name}`);
        else {
          stream.pipe(writer); // stream is the content body (might be an empty stream)
          stream.on("end", () => next()); // ready for next entry
          stream.resume(); // just auto drain the stream
        }
      });
      extract.on("finish", () => {
        resolve(writer.toBuffer()); // Return the contents of the first entry
      });
      readStream.pipe(extract);
    });
  }
}

module.exports = copyFileFromToBuffer;
