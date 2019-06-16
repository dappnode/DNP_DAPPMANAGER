const listImages = require("./listImages");
const { stringIncludes } = require("utils/strings");

/**
 * Gets a single image from listImages
 * @param {string} id "dappmanager.dnp.dappnode.eth"
 * @returns {object} raw docker data
 */
async function getImage(id) {
  const images = await listImages();
  const image = images.find(img =>
    img.RepoTags.some(tag => stringIncludes(tag, id))
  );
  if (!image) throw Error(`No image found for id ${id}`);
  return image;
}

module.exports = getImage;
