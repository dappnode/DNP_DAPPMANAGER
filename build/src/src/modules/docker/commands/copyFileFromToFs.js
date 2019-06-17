const fs = require("fs");
const path = require("path");
const getContainerInstance = require("../lowLevelCommands/getContainerInstance");
const getContainerWorkingDir = require("./getContainerWorkingDir");

/**
 * [NOTE] files are always returned as .tar
 *
 * @param {string} id "bitcoin.dnp.dappnode.eth"
 * @param {string} pathContainer "/temp/config.json"
 * @param {string} pathHost "/files/config.json.tar"
 */
async function copyFileFromToFs(id, { pathContainer, pathHost }) {
  const container = await getContainerInstance(id);

  /**
   * - container.putArchive does NOT support relative paths
   *   provide support for relative paths by fetching workingDir
   */
  if (!pathContainer || !path.isAbsolute(pathContainer)) {
    const workingDir = await getContainerWorkingDir(id);
    pathContainer = path.join(workingDir || "/", pathContainer);
  }

  const readStream = await container.getArchive({ path: pathContainer });
  const writeStream = fs.createWriteStream(pathHost, "utf8");
  readStream.pipe(writeStream);

  await new Promise((resolve, reject) => {
    readStream.on("end", resolve);
    readStream.on("error", reject);
  });
}

module.exports = copyFileFromToFs;
