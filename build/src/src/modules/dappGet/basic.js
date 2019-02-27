const dockerList = require('modules/dockerList');
const logs = require('logs.js')(module);
const getManifest = require('modules/getManifest');
const shouldUpdate = require('./utils/shouldUpdate');

/**
 * The dappGet resolver may cause errors.
 * Updating the core will never require dependency resolution,
 * therefore for a system update the dappGet resolver will be emitted
 *
 * If BYPASS_   RESOLVER == true, just fetch the first level dependencies of the request
 */

async function dappGetBasic(req) {
    const reqManifest = await getManifest(req);
    // reqManifest.dependencies = {
    //     'bind.dnp.dappnode.eth': '0.1.4',
    //     'admin.dnp.dappnode.eth': '/ipfs/Qm...',
    // }

    // Append dependencies in the list of DNPs to install
    const result = {
        success: (reqManifest || {}).dependencies || {},
    };
    // Add current request to pacakages to install
    result.success[req.name] = req.ver;

    // The function below does not directly affect funcionality.
    // However it would prevent already installed DNPs from installing
    try {
        const dnps = await dockerList.listContainers();
        dnps.forEach((dnp) => {
            if (dnp.name && dnp.version && result.success && result.success[dnp.name]) {
                const currentVersion = dnp.version;
                const newVersion = result.success[dnp.name];
                if (!shouldUpdate(currentVersion, newVersion)) {
                    delete result.success[dnp.name];
                }
            }
        });
    } catch (e) {
        logs.error('Error listing current containers: ' + e);
    }

    return result;
}

module.exports = dappGetBasic;
