const ENSRegistry = artifacts.require("ENSRegistry");
const FIFSRegistrar = artifacts.require("FIFSRegistrar");
const PublicResolver = artifacts.require("PublicResolver");
const ethers = require("ethers");

const tld = "test";
const labelhash = (label) => ethers.utils.keccak256(utils.toUtf8Bytes(label));
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ZERO_HASH =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

module.exports = async function (accounts) {
  const ens = await ENSRegistry.new();
  const resolver = await PublicResolver.new(ens.address, ZERO_ADDRESS);
  await setupResolver(ens, resolver, accounts);
  const registrar = await FIFSRegistrar.new(ens.address, hash(tld));
  await setupRegistrar(ens, registrar);
};

async function setupResolver(ens, resolver, accounts) {
  const resolverNode = hash("resolver");
  const resolverLabel = labelhash("resolver");
  await ens.setSubnodeOwner(ZERO_HASH, resolverLabel, accounts[0]);
  await ens.setResolver(resolverNode, resolver.address);
  await resolver["setAddr(bytes32,address)"](resolverNode, resolver.address);
}

async function setupRegistrar(ens, registrar) {
  await ens.setSubnodeOwner(ZERO_HASH, labelhash(tld), registrar.address);
}
