const logs = require("logs.js")(module);
const directoryContract = require("contracts/directory.json");
const web3 = require("./web3Setup");
const isEnsDomain = require("utils/isEnsDomain");

// Contract parameters
const DAppNodePackageStatus = ["Deleted", "Active", "Developing"];

/**
 * Fetches all package names in the custom dappnode directory.
 *
 * @returns {array} An array of objects:
 *  [
 *    {
 *      name: packageName,   {string}
 *      status: 1            {number}
 *      statusName: "Active" {string}
 *      position: 2000,      {number}
 *      directoryId: 3       {number}
 *    },
 *    ...
 *  ]
 */
async function getDirectory() {
  const directory = new web3.eth.Contract(
    directoryContract.abi,
    directoryContract.address
  );
  const numberOfDAppNodePackages = parseInt(
    await directory.methods.numberOfDAppNodePackages().call()
  );

  // Get featured packages list
  // 0x0b00000000000000000000000000000000000000000000000000000000000000
  const featuredBytes = await directory.methods.featured().call();
  // ["0b", "00", ...]
  /**
   * 1. Strip hex prefix
   * 2. Split by substrings of 2 characters
   * 3. Remove 0 indexes
   * 4. Remove duplicate indexes
   * 5. Base64 to decimal index
   */
  const featuredIndexes = featuredBytes
    .replace("0x", "")
    .match(/.{1,2}/g)
    .filter(value => value !== "00")
    .filter((value, index, self) => self.indexOf(value) === index)
    .map(base64 => parseInt(base64, 16));

  let directoryIds = [];
  for (let i = 0; i < numberOfDAppNodePackages; i++) {
    directoryIds.push(i);
  }

  let packages = [];
  await Promise.all(
    directoryIds.map(async i => {
      try {
        const {
          name,
          status: statusBn,
          position: positionBn
        } = await directory.methods.getPackage(i).call();

        const status = parseInt(statusBn);
        const position = parseInt(positionBn);

        // Make sure the DNP is not Deprecated or Deleted
        if (!isEnsDomain(name) || status === 0) return;

        const pkg = {
          name,
          status,
          statusName: DAppNodePackageStatus[status],
          position,
          directoryId: i
        };

        const featuredIndex = featuredIndexes.indexOf(i);
        if (featuredIndex > -1) {
          pkg.isFeatured = true;
          pkg.featuredIndex = featuredIndex;
        }

        packages.push(pkg);
      } catch (e) {
        logs.error(`Error retrieving DNP #${i} from directory: ${e.stack}`);
      }
    })
  );

  return packages;
}

module.exports = getDirectory;
