const AppStorage = artifacts.require("AppStorage");
const Initializable = artifacts.require("Initializable");
const ACLSyntaxSugar = artifacts.require("ACLSyntaxSugar");
const EVMScriptRunner = artifacts.require("EVMScriptRunner");
const AragonApp = artifacts.require("AragonApp");
const AppProxyFactory = artifacts.require("AppProxyFactory");
const ApmRegistryConstants = artifacts.require("ApmRegistryConstants");
const APMRegistry = artifacts.require("APMRegistry");

module.exports = function (deployer) {
  deployer
    .deploy(AppStorage)
    .then(() => deployer.deploy(Initializable))
    .then(() => deployer.deploy(ACLSyntaxSugar))
    .then(() => deployer.deploy(EVMScriptRunner))
    .then(() => deployer.deploy(AragonApp))
    .then(() => deployer.deploy(AppProxyFactory))
    .then(() => deployer.deploy(ApmRegistryConstants))
    .then(() => deployer.deploy(APMRegistry));
};
