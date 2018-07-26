const logs = require('logs.js')(module);
const directoryContract = require('contracts/directory.json');
const web3Default = require('./web3Setup');

function createGetDirectory({
  web3 = web3Default({}),
}) {
  // Contract parameters
  const DAppNodePackageStatus = ['Preparing', 'Develop', 'Active', 'Deprecated', 'Deleted'];

  // Main method
  return async function getDirectory() {
    // Expects no input
    // Return an array of objects:
    //   [
    //     {
    //       name: packageName,  (string)
    //       status: 'Preparing' (string)
    //     },
    //     ...
    //   ]

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
  };
}


module.exports = createGetDirectory;
