const getDirectory = require('modules/getDirectory');
const dockerList = require('modules/dockerList');


/**
 * Fetches all package names in the custom dappnode directory.
 * This feature helps the ADMIN UI load the directory data faster.
 *
 * @param {Object} kwargs: {}
 * @return {Object} A formated success message.
 * result: packages =
 *   [
 *     {
 *       name: packageName, (string)
 *       status: 'Preparing', (string)
 *       currentVersion: '0.1.2' or null, (String)
 *     },
 *     ...
 *   ]
 */
const fetchDirectory = async () => {
  // Make sure the chain is synced
  // if (await ethchain.isSyncing()) {
  //   return res.success('Mainnet is syncing', []);
  // }

  // List of available packages in the directory
  // Return an array of objects:
  //   [
  //     {
  //       name: packageName,  (string)
  //       status: 'Preparing' (string)
  //     },
  //     ...
  //   ]
  const packages = await getDirectory();

  // List of current packages locally
  const dnpList = await dockerList.listContainers();

  // Extend package object contents
  for (const pkg of packages) {
    // Fetch the current package version
    const _package = dnpList.filter((c) => c.name == pkg.name)[0];
    pkg.currentVersion = _package ? _package.version : null;
  }

  return {
    message: 'Listed directory with ' + packages.length + ' packages',
    result: packages,
    logMessage: true,
  };
};


module.exports = fetchDirectory;
