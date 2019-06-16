const docker = require("../dockerApiSetup");

/**
 * Returns the list of docker images
 * @returns {array}
 */
function listImages() {
  return new Promise((resolve, reject) => {
    docker.listImages((err, images) => {
      if (err) reject(err);
      else resolve(images);
    });
  });
}

module.exports = listImages;
