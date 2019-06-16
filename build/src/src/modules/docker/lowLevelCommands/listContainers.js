const docker = require("../dockerApiSetup");

/**
 * Returns the list of containers
 * [NOTE] On a full DAppNode will 14 containers the call takes 17ms on average
 * @returns {array}
 */
function listContainers() {
  return new Promise((resolve, reject) => {
    docker.listContainers((err, containers) => {
      if (err) reject(err);
      else resolve(containers);
    });
  });
}

module.exports = listContainers;
