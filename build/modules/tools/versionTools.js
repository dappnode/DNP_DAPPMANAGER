const semver = require('semver');

let highestVersion = function (v1, v2) {
  if (!v1 || !v2) {
    return 'latest';
  }
  if (v1 == 'latest' || v2 == 'latest') {
    return 'latest';
  }
  if (!semver.valid(v1) || !semver.valid(v2)) {
    throw new Error('Attempting to compare invalid versions, version1: '+v1+' version2: '+v2)
  }
  if (semver.gt(v1, v2)) {
    return v1;
  } else {
    return v2;
  }
};

exports.highestVersion = highestVersion;

function isVersionUpToDate(currentVersion, requestedVersion) {
  // Checking if version 1 >= version2
  if (!currentVersion) {
    return false;
    // If currentVersion doesn't exist, then update
  } else if (currentVersion == 'latest') {
    return true;
    // If current version is the latest, then it's up to date
  } else if (requestedVersion == 'latest') {
    return false;
    // If the current version is not the latest, then the latest is more up to date
  }
  let cur = currentVersion.split(".");
  let req = requestedVersion.split(".");
  if (cur.length != req.length ) {
    throw new Error('Attempting to compare incompatible versions, version1: '+version1+' version2: '+version2)
  }
  for (let i = 0; i < cur.length; i++) {
    // Checking each number of the Semantic Versioning 2.0.0
    if (parseInt(cur[i]) > parseInt(req[i])) {
      return true;
      // current > required = up to date
    } else if (parseInt(cur[i]) < parseInt(req[i])) {
      return false;
      // current < required = NOT up to date
    }
  }
  return true;
  // Here, both versions are equal = up to date
}
