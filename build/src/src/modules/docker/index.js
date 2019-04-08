const docker = require("./Docker");
const dockerSafe = require("./dockerSafe");

module.exports = {
  ...docker,
  safe: dockerSafe
};
