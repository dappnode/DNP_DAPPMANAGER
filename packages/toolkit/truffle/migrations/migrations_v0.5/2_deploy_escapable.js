const Escapable = artifacts.require("Escapable");

module.exports = function (deployer) {
  const escapeHatchCaller = "0x1234567890123456789012345678901234567890";
  const escapeHatchDestination = "0x0987654321098765432109876543210987654321";
  deployer.deploy(Escapable, escapeHatchCaller, escapeHatchDestination);
};
