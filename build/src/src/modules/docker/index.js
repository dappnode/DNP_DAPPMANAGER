// Higher level commands

const cleanOldImages = require("./commands/cleanOldImages");
const copyFileFromToBuffer = require("./commands/copyFileFromToBuffer");
const copyFileFromToFs = require("./commands/copyFileFromToFs");
const copyFileTo = require("./commands/copyFileTo");
const getContainerWorkingDir = require("./commands/getContainerWorkingDir");
const getDnpData = require("./commands/getDnpData");
const getDnpExtendedData = require("./commands/getDnpExtendedData");
const getDnpLogs = require("./commands/getDnpLogs");
const getDnpsExtendedData = require("./commands/getDnpsExtendedData");
const getPathInfo = require("./commands/getPathInfo");
const loadImage = require("./commands/loadImage");
const removeDnpVolumes = require("./commands/removeDnpVolumes");
const restartDnp = require("./commands/restartDnp");
const toggleDnp = require("./commands/toggleDnp");

// Wrapped direct docker commands

const composeUp = require("./lowLevelCommands/composeUp");
const composeRm = require("./lowLevelCommands/composeRm");
const systemDf = require("./lowLevelCommands/systemDf");

module.exports = {
  // Higher level commands
  cleanOldImages,
  copyFileFromToBuffer,
  copyFileFromToFs,
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
  getDnps: getDnpsExtendedData,

  // Wrapped direct docker commands
  composeUp,
  composeRm,
  systemDf
};
