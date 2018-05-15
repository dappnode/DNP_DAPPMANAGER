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
