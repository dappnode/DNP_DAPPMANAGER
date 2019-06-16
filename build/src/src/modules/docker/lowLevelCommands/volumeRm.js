const docker = require("../dockerApiSetup");

/**
 * Remove a docker volume by name
 * @param {string} name "nginxproxydnpdappnodeeth_html"
 */
async function volumeRm(name) {
  const volume = await docker.getVolume(name);
  await volume.remove({ force: true });
}

module.exports = volumeRm;
