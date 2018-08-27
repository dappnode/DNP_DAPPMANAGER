const semver = require('semver');
const validate = require('./validate');

/*
 * Wrapper for the semver library. In the DAPPMANAGER versions can be:
 * - 0.1.4 (any semver)
 * - 'latest'
 * - 'QmZv43ndN...' (an IPFS hash)
 * - undefinded
 * This wrapper guards against this extra cases.
*/

function isHigher(v1, v2) {
  const ipfs = '999.9.10';
  const latest = '999.9.9';
  // if v1 and v2 are ipfs hashes, prioritize above latest
  if (v1 && validate.isIPFShash(v1)) v1 = ipfs;
  if (v2 && validate.isIPFShash(v2)) v2 = ipfs;
  // if v1 and v2 are undefined they are latest
  if (!semver.valid(v1)) v1 = latest;
  if (!semver.valid(v2)) v2 = latest;
  // checking if v1 > v2
  return semver.gt(v1, v2);
}

function highestVersion(v1, v2) {
  // If no version is passed return the other
  if (!v1 && v2) return v2;
  if (!v2 && v1) return v1;
  if (!v1 && !v2) throw Error('Comparing two undefined versions');

  // If any version is latest return latest
  if (v1 == 'latest' || v2 == 'latest') return 'latest';

  // Compare semantic versions
  if (!semver.valid(v1) || !semver.valid(v2)) {
    throw new Error('Attempting to compare invalid versions, version1: '+v1+' version2: '+v2);
  }
  if (semver.gt(v1, v2)) {
    return v1;
  } else {
    return v2;
  }
}


module.exports = {
  highestVersion,
  isHigher,
};
