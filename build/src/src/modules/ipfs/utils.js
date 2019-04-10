const isIPFS = require("is-ipfs");

// Declare utility methods
const parseResHash = res => {
  // Prevent uncontrolled errors
  if (
    !(res && res[0] && res[0].hash && typeof res[0].hash === typeof "String")
  ) {
    throw new Error(`Wrong parameters, res: ${JSON.stringify(res)}`);
  }
  return res[0].hash;
};

const validateIpfsHash = hash => {
  if (!hash || typeof hash !== "string") throw Error("Hash must be a string");
  // Correct hash prefix
  if (hash.includes("ipfs/")) {
    hash = hash.split("ipfs/")[1];
  }
  hash.replace("/", "");
  // Make sure hash if valid
  if (!isIPFS.multihash(hash)) {
    throw Error(`Invalid IPFS hash: ${hash}`);
  }
  return hash;
};

module.exports = {
  parseResHash,
  validateIpfsHash
};
