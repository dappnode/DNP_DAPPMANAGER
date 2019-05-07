const versionData = require("utils/getVersionData");

/**
 * Returns the version data of this specific build
 *
 * @returns {object} versionData = {
 *   version: "0.1.21",
 *   branch: "master",
 *   commit: "ab991e1482b44065ee4d6f38741bd89aeaeb3cec"
 * }
 */
const getVersionData = async () => {
  return {
    message: "Got version data",
    result: versionData
  };
};

module.exports = getVersionData;
