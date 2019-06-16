const cleanOldImages = require("./cleanOldImages");
const copyFileFrom = require("./copyFileFrom");
const copyFileTo = require("./copyFileTo");
const getContainerWorkingDir = require("./getContainerWorkingDir");
const getDnpData = require("./getDnpData");
const getDnpExtendedData = require("./getDnpExtendedData");
const getDnpLogs = require("./getDnpLogs");
const getDnpsExtendedData = require("./getDnpsExtendedData");
const getPathInfo = require("./getPathInfo");
const loadImage = require("./loadImage");
const removeDnpVolumes = require("./removeDnpVolumes");
const restartDnp = require("./restartDnp");
const toggleDnp = require("./toggleDnp");

module.exports = {
  cleanOldImages,
  copyFileFrom,
  copyFileTo,
  getContainerWorkingDir,
  getDnpData,
  getDnpExtendedData,
  getDnpLogs,
  getPathInfo,
  loadImage,
  removeDnpVolumes,
  restartDnp,
  toggleDnp,
  // Alias
  getDnp: getDnpExtendedData,
  getDnps: getDnpsExtendedData
};
