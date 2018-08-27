const logs = require('logs.js')(module);
const directoryContract = require('contracts/directory.json');
const web3 = require('./web3Setup');


// Contract parameters
const DAppNodePackageStatus = ['Preparing', 'Develop', 'Active', 'Deprecated', 'Deleted'];

/**
 * Stops or starts after fetching its status
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
  const directory = new web3.eth.Contract(directoryContract.abi, directoryContract.address);
  const numberOfDAppNodePackages = parseFloat(
    await directory.methods.numberOfDAppNodePackages().call()
  );

  let packages = [];
  for (let i = 0; i < numberOfDAppNodePackages; i++) {
    try {
      const pkg = await directory.methods.getPackage(i).call();
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
