const semver = require("semver");
const docker = require("../dockerApiSetup");
const listImages = require("../lowLevelCommands/listImages");
const { stringIncludes } = require("utils/strings");

/**
 * Cleans older images of a specific DNP and version
 * @param {string} name "bitcoin.dnp.dappnode.eth"
 * @param {string} version
 */
async function cleanOldImages(name, version) {
  const currentImgs = await listImages();
  const imagesToDelete = currentImgs.filter(img =>
    img.RepoTags.some(tag => {
      const [imgName, imgVer] = tag.split(":");
      return (
        stringIncludes(imgName, name) &&
        semver.valid(imgVer) &&
        !stringIncludes(imgVer, version)
      );
    })
  );

  for (const imageToDelete of imagesToDelete) {
    const image = await docker.getImage(imageToDelete.Id);
    await image.remove({ force: true });
  }

  return imagesToDelete.map(img => img.Id);
}

module.exports = cleanOldImages;
