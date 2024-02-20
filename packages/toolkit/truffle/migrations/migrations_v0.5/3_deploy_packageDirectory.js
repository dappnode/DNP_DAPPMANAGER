const Owned = artifacts.require("Owned");
const Escapable = artifacts.require("Escapable");
const DAppNodePackageDirectory = artifacts.require("DAppNodePackageDirectory");

module.exports = function (deployer) {
  let owned, escapable;
  deployer
    .deploy(Owned)
    .then(function (instance) {
      owned = instance;
      return deployer.deploy(
        Escapable,
        "0x1234567890123456789012345678901234567890",
        "0x0987654321098765432109876543210987654321"
      );
    })
    .then(function (instance) {
      escapable = instance;
      return deployer.deploy(
        DAppNodePackageDirectory,
        owned.address,
        escapable.address
      );
    });
};
