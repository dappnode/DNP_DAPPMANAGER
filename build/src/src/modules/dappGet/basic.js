const dockerList = require("modules/dockerList");
const logs = require("logs.js")(module);
const getManifest = require("modules/getManifest");

/**
 * The dappGet resolver may cause errors.
 * Updating the core will never require dependency resolution,
 * therefore for a system update the dappGet resolver will be emitted
 *
 * If BYPASS_RESOLVER == true, just fetch the first level dependencies of the request
 */

async function dappGetBasic(req) {
  const reqManifest = await getManifest(req);
  // reqManifest.dependencies = {
  //     'bind.dnp.dappnode.eth': '0.1.4',
  //     'admin.dnp.dappnode.eth': '/ipfs/Qm...',
  // }

  // Append dependencies in the list of DNPs to install
  // Add current request to pacakages to install
  const state = {
    ...((reqManifest || {}).dependencies || {}),
    [req.name]: req.ver
  };

  // The function below does not directly affect funcionality.
  // However it would prevent already installed DNPs from installing
  try {
    const installedDnps = await dockerList.listContainers();
    for (const { name, version } of installedDnps) {
      if (name && version && state[name] && state[name] === version)
        delete state[name];
    }
  } catch (e) {
    logs.error(`Error listing current containers: ${e.stack}`);
  }

  return {
    message: "dappGet basic resolved first level dependencies",
    state,
    alreadyUpdated: {}
  };
}

module.exports = dappGetBasic;
