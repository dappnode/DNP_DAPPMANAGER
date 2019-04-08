const ipfs = require("modules/ipfs");
const logs = require("logs.js")(module);
const compressAvatar = require("utils/compressAvatar");

async function getAvatar(avatarHash) {
  let avatar;
  const imageBuffer = await ipfs.cat(avatarHash, { buffer: true });
  try {
    avatar = await compressAvatar(imageBuffer, 200);
  } catch (e) {
    logs.warn(
      `Error compressing avatar ${avatarHash}: ${e.message} ${e.stack}`
    );
    avatar = imageBuffer.toString("base64");
  }
  return "data:image/png;base64," + avatar;
}

module.exports = getAvatar;
