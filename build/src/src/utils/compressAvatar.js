const resizeImg = require("./resizeImg");
const imageminPngquant = require("imagemin-pngquant");

/**
 * Fetching DAppNode's directory can be slow. The highest payload are the packages' avatars
 * The avatars are encouraged to be of a certain size, but we cannot control what future
 * devs put as the avatar of their package. Also, the recommended size of the avatar
 * is ~600x600px to ensure usability in future use cases. However, the current ADMIN UI
 * only needs ~200x200px resolution.
 *
 * This utility helps reduce the load and proctect agains big avatars.
 *
 * The compression should only be computed once, as the directory is cached
 * The size reduction are:
 * (KBs, sum of all 14 avatars for the current directory, where most are already compressed)
 * (Source resolution averages 600x600px, output resolution is 200x200px)
 *
 * Source (base64)      473.156 KB
 * Compressed (base64)  144.704 KB (-70%)
 *
 * Benchmarks on a personal laptop showed on average (current 14 avatars) in SERIES:
 *
 * 120 ms / avatar
 */

/**
 * Resizes and compresses an image to a specific size. Returns square png
 *
 * @param {Buffer} inputDataOrFile Can be a Buffer or path to the image
 * @param {Integer} outPutResolution The image is forced to be a square of
 *                                   outPutResolution x outPutResolution px
 * @returns {string} base64 representation of the image
 */
async function compressAvatar(inputDataOrFile, outPutResolution) {
  const resizedImgBuffer = await resizeImg(inputDataOrFile, outPutResolution);
  const compressedImgBuffer = await imageminPngquant({
    quality: "0-95"
  })(resizedImgBuffer);
  return compressedImgBuffer.toString("base64");
}

module.exports = compressAvatar;
