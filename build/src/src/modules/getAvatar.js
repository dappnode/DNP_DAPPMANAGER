const downloadAvatar = require("modules/downloadAvatar");

async function getAvatar(avatarHash) {
  return await downloadAvatar(avatarHash);
}

module.exports = getAvatar;
