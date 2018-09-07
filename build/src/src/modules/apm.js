// node modules
const semver = require('semver');

// dedicated modules
const logs = require('logs.js')(module);
const validate = require('utils/validate');
const web3 = require('./web3Setup');

const ensContract = require('contracts/ens.json');
const publicResolverContract = require('contracts/publicResolver.json');
const repoContract = require('contracts/repository.json');

function namehash(name, web3) {
    let node = '0x0000000000000000000000000000000000000000000000000000000000000000';
    if (name != '') {
        let labels = name.split('.');
        for (let i = labels.length - 1; i >= 0; i--) {
            node = web3.utils.sha3(node + web3.utils.sha3(labels[i]).slice(2), {encoding: 'hex'});
        }
    }
    return node.toString();
}

// Declare utility methods
const getRepoContract = async (reponame) => {
  const ens = new web3.eth.Contract(ensContract.abi, ensContract.address);
  const resolverAddress = await ens.methods.resolver(namehash(reponame, web3)).call();

  if (resolverAddress == '0x0000000000000000000000000000000000000000') {
    return;
  }

  const resolver = new web3.eth.Contract(publicResolverContract.abi, resolverAddress);
  const repoAddr = await resolver.methods.addr(namehash(reponame, web3)).call();
  return new web3.eth.Contract(repoContract.abi, repoAddr);
};

const getLatestVersion = async (repo) => {
  const latest = await repo.methods.getLatest()
  .call()
  .then(function(result) {
      return web3.utils.hexToAscii(result.contentURI);
  })
  .catch((err) => {
      throw Error(err);
  });
  return latest;
};

const getSemanticVersion = async (repo, version) => {
  const latest = await repo.methods.getBySemanticVersion(version)
  .call()
  .then(function(result) {
      return web3.utils.hexToAscii(result.contentURI);
  })
  .catch((err) => {
      if (err.message == 'Couldn\'t decode uint16 from ABI: 0x') {
          return 'NOT_VALID_VERSION';
      } else {
          throw Error(err);
      }
  });
  return latest;
};

// Declare methods

// /////////////  getRepoHash
// /////////////  getRepoHash
// /////////////  getRepoHash
// /////////////  getRepoHash
// /////////////  getRepoHash

const getRepoHash = async (packageReq) => {
  validate.packageReq(packageReq);
  const NAME = packageReq.name;
  const VERSION = packageReq.ver;
  validate.isEthDomain(NAME); // Validate the provided name, it only accepts .eth domains

  let repo = await getRepoContract(NAME, web3);
  if (!repo) {
    throw Error('Resolver could not found a match for ' + NAME);
  }

  if (semver.valid(VERSION)) {
    // Getting the specific version provided
    let versionArray = semver.clean(VERSION).split('.');
    return getSemanticVersion(repo, versionArray, web3);
  } else {
    return getLatestVersion(repo, web3);
  }
};

/**
 * Versions
 *
 * @param {*} packageReq
 * @return {*}
 */
const getLatestWithVersion = async (packageReq) => {
  if (!packageReq || typeof packageReq !== 'object') {
    throw Error('Wrong packageReq: '+packageReq);
  }
  if (!packageReq.name) {
    throw Error('packageReq must contain a name property: '+packageReq);
  }

  const {name} = packageReq;
  validate.isEthDomain(name); // Validate the provided name, it only accepts .eth domains

  const repo = await getRepoContract(name, web3);
  if (!repo) {
    throw Error('Resolver could not found a match for ' + name);
  }

  const versionCount = parseFloat(await repo.methods.getVersionsCount().call());
  const versions = {};
  // versionIndexes = [1, 2, 3, 4, 5, ...]

  /**
   * Versions called by id are ordered in ascending order.
   * The min version = 1 and the latest = versionCount
   *
   *  i | semanticVersion
   * ---|------------------
   *  1 | [ '0', '0', '1' ]
   *  2 | [ '0', '0', '2' ]
   *  3 | [ '0', '0', '3' ]
   *  4 | [ '0', '0', '4' ]
   */
  try {
    const {semanticVersion} = await repo.methods.getByVersionId(versionCount).call();
    // semanticVersion = [1, 0, 8]. It is joined to form a regular semver string
    // Append version result to the versions object
    versions[semanticVersion.join('.')] = await getSemanticVersion(repo, semanticVersion, web3);
  } catch (e) {
    // If you request an inexistent ID to the contract, web3 will throw
    // Error: couldn't decode uint16 from ABI. The try, catch block will catch that
    // and log other errors
    if (String(e).includes('decode uint16 from ABI')) {
      logs.error('Attempting to fetch an inexistent version');
    } else {
      logs.error(e);
    }
  }
  return versions;
};

/**
 * Versions
 *
 * @param {*} packageReq
 * @return {*}
 */
const getRepoVersions = async (packageReq) => {
  if (!packageReq || typeof packageReq !== 'object') {
    throw Error('Wrong packageReq: '+packageReq);
  }
  if (!packageReq.name) {
    throw Error('packageReq must contain a name property: '+packageReq);
  }

  const {name} = packageReq;
  validate.isEthDomain(name); // Validate the provided name, it only accepts .eth domains

  const repo = await getRepoContract(name, web3);
  if (!repo) {
    throw Error('Resolver could not found a match for ' + name);
  }

  const versionCount = parseFloat(await repo.methods.getVersionsCount().call());
  const versions = {};
  // versionIndexes = [1, 2, 3, 4, 5, ...]
  const versionIndexes = [...Array(versionCount).keys()].map((i) => i+1);

  /**
   * Versions called by id are ordered in ascending order.
   * The min version = 1 and the latest = versionCount
   *
   *  i | semanticVersion
   * ---|------------------
   *  1 | [ '0', '0', '1' ]
   *  2 | [ '0', '0', '2' ]
   *  3 | [ '0', '0', '3' ]
   *  4 | [ '0', '0', '4' ]
   */
  await Promise.all(versionIndexes.map(async (i) => {
    try {
      const {semanticVersion} = await repo.methods.getByVersionId(i).call();
      // semanticVersion = [1, 0, 8]. It is joined to form a regular semver string
      // Append version result to the versions object
      versions[semanticVersion.join('.')] = await getSemanticVersion(repo, semanticVersion, web3);
    } catch (e) {
      // If you request an inexistent ID to the contract, web3 will throw
      // Error: couldn't decode uint16 from ABI. The try, catch block will catch that
      // and log other errors
      if (String(e).includes('decode uint16 from ABI')) {
        logs.error('Attempting to fetch an inexistent version');
      } else {
        logs.error(e);
      }
    }
  }));

  return versions;
};


module.exports = {
  getRepoVersions,
  getRepoHash,
  getRepoContract,
  getLatestVersion,
  getSemanticVersion,
  getLatestWithVersion,
};
