const fs = require("fs");
const { promisify } = require("util");
const docker = require("../dockerApiSetup");
const getPath = require("utils/getPath");
const params = require("params");
const validate = require("utils/validate");

const unlinkAsync = promisify(fs.unlink);

/**
 * Cleans older images of a specific DNP and version
 * @param {string} name "bitcoin.dnp.dappnode.eth"
 * @param {string} version "0.2.1"
 * @param {bool} isCore false
 */
async function loadImage(name, version, isCore) {
  const imageName = `${name}_${version}.tar.xz`;
  const imagePath = validate.path(
    getPath.image(name, imageName, params, isCore)
  );

  const data = fs.createReadStream(imagePath);
  await docker.loadImage(data);
  // Remove image after loading
  await unlinkAsync(imagePath);
}

module.exports = loadImage;
