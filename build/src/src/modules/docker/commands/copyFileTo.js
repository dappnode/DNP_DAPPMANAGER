const path = require("path");
const tar = require("tar-stream");
const getContainerInstance = require("../lowLevelCommands/getContainerInstance");
const getContainerWorkingDir = require("./getContainerWorkingDir");

/**
 * Copy content to a container's path
 * @param {string} id "bitcoin.dnp.dappnode.eth"
 * @param {string} pathContainer "/usr/src/app"
 * @param {buffer|string} content Can be either a buffer or an utf8 string
 * @param {string} filename "config.json"
 */
async function copyFileTo(id, { pathContainer, content, filename }) {
  const container = await getContainerInstance(id);

  /**
   * - pathContainer MUST be defined, otherwise container.putArchive fails
   * - container.putArchive does NOT support relative paths
   *   provide support for relative paths by fetching workingDir
   */
  if (!pathContainer || !path.isAbsolute(pathContainer)) {
    const workingDir = await getContainerWorkingDir(id);
    pathContainer = path.join(workingDir || "/", pathContainer);
  }

  const pack = tar.pack(); // pack is a streams2 stream
  pack.entry({ name: filename }, content);
  pack.finalize();

  await new Promise((resolve, reject) => {
    container.putArchive(pack, { path: pathContainer }, err => {
      if (err) {
        if (err.statusCode === 404 && err.message.includes("not find"))
          reject(Error(`Path "${pathContainer}" does not exist`));
        else reject(err);
      } else resolve();
    });
  });
}

module.exports = copyFileTo;
