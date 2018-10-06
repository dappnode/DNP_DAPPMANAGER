const logs = require('logs.js')(module);
const eth = require('./ethSetup');

// Import contract data
const directoryContract = require('contracts/directory.json');

// Setup instances
const directory = eth.contract(directoryContract.abi).at(directoryContract.address);

// Contract parameters
const DAppNodePackageStatus = ['Preparing', 'Develop', 'Active', 'Deprecated', 'Deleted'];

 /**
  * Fetches all package names in the custom dappnode directory.
  *
  * @return {Array} An array of objects:
  *  [
  *    {
  *      name: packageName,  (string)
  *      status: 'Preparing' (string)
  *    },
  *    ...
  *  ]
  */
async function getDirectory() {
  const numberOfDAppNodePackages = parseFloat(
    await directory.numberOfDAppNodePackages()
  );

  let packages = [];
  for (let i = 0; i < numberOfDAppNodePackages; i++) {
    try {
      const pkg = await directory.getPackage(i);
      packages.push({
        name: pkg.name,
        status: DAppNodePackageStatus[pkg.status],
      });
    } catch (e) {
      logs.error('Error retrieving package #' + i + ' from directory, err: ' + e);
    }
  }
  return packages;
}


module.exports = getDirectory;
