const logs = require("logs.js")(module);
const directoryContract = require("contracts/directory.json");
const web3 = require("./web3Setup");
const isEnsDomain = require("utils/isEnsDomain");

// Contract parameters
const DAppNodePackageStatus = [
  "Preparing",
  "Develop",
  "Active",
  "Deprecated",
  "Deleted"
];

/**
 * Fetches all package names in the custom dappnode directory.
 *
 * @returns {array} An array of objects:
 *  [
 *    {
 *      name: packageName,  (string)
 *      status: 'Preparing' (string)
 *    },
 *    ...
 *  ]
 */
async function getDirectory() {
  const directory = new web3.eth.Contract(
    directoryContract.abi,
    directoryContract.address
  );
  const numberOfDAppNodePackages = parseFloat(
    await directory.methods.numberOfDAppNodePackages().call()
  );

  let packages = [];
  for (let i = 0; i < numberOfDAppNodePackages; i++) {
    try {
      const { name, status } = await directory.methods.getPackage(i).call();
      // Make sure the DNP is not Deprecated or Deleted
      if (isEnsDomain(name) && status < 3)
        packages.push({
          name,
          status: DAppNodePackageStatus[status],
          directoryId: i
        });
    } catch (e) {
      logs.error(`Error retrieving DNP #${i} from directory: ${e.stack}`);
    }
  }
  return packages;
}

module.exports = getDirectory;
