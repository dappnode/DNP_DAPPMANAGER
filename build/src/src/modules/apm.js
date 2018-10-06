// node modules
const semver = require('semver');

// dedicated modules
const logs = require('logs.js')(module);
const validate = require('utils/validate');
const eth = require('./ethSetup');
const ENS = require('ethjs-ens');

// Import contract data
const repoContract = require('contracts/repository.json');

// Setup instances
const Repo = eth.contract(repoContract.abi);

const ens = new ENS({provider: eth.currentProvider, network: '1'});

// eth.js HOW TO
//
// const token = eth.contract(tokenABI).at('0x6e0E0e02377Bc1d90E8a7c21f12BA385C2C35f78');
// token.totalSupply().then((totalSupply) => {
//   // result <BN ...>  4500000
// });

// Declare utility methods
const getRepoContract = async (reponame) => {
  const repoAddress = await ens.lookup('admin.dnp.dappnode.eth')
  .catch((e) => {
    if (e.message && e.message.includes('ENS name not defined')) {
      throw Error(`Could not find a repo for ${reponame}`);
    } else {
      throw e;
    }
  });
  return Repo.at(repoAddress);
};

const getLatestVersion = (repo) => repo.getLatest()
  .then((result) => eth.toAscii(result.contentURI))
  .catch((err) => {
      throw Error(err);
  });

const getSemanticVersion = async (repo, version) => repo.getBySemanticVersion(version)
  .then((result) => eth.toAscii(result.contentURI))
  .catch((err) => {
      if (err.message == 'Couldn\'t decode uint16 from ABI: 0x') {
          return 'NOT_VALID_VERSION';
      } else {
          throw Error(err);
      }
  });


/**
 * Declare methods
 */


const getRepoHash = async (packageReq) => {
  validate.packageReq(packageReq);
  const NAME = packageReq.name;
  const VERSION = packageReq.ver;
  // Validate the provided name, it only accepts .eth domains
  validate.isEthDomain(NAME);

  const repo = await getRepoContract(NAME);
  if (!repo) {
    throw Error('Resolver could not found a match for ' + NAME);
  }

  if (semver.valid(VERSION)) {
    const versionArray = semver.clean(VERSION).split('.');
    return getSemanticVersion(repo, versionArray);
  } else {
    return getLatestVersion(repo);
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

  const repo = await getRepoContract(name);
  if (!repo) {
    throw Error('Resolver could not found a match for ' + name);
  }

  const versionCount = await repo.getVersionsCount()
    .then((res) => res[0].toNumber());
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
    const semanticVersion = await repo.getByVersionId(versionCount)
      .then((res) => res.semanticVersion);
    // semanticVersion = [1, 0, 8]. It is joined to form a regular semver string
    // Append version result to the versions object
    versions[semanticVersion.join('.')] = await getSemanticVersion(repo, semanticVersion);
  } catch (e) {
    // If you request an inexistent ID to the contract, web3 will throw
    // Error: couldn't decode uint16 from ABI. The try, catch block will catch that
    // and log other errors
    if (String(e).includes('decode uint16 from ABI')) {
      logs.error('Attempting to fetch an inexistent version');
    } else {
      logs.error('Error getting latest version of '+name+': '+e.stack);
    }
  }
  return versions;
};

/**
 * Versions
 *
 * @param {*} packageReq
 * @param {*} verReq
 * @return {*}
 */
const getRepoVersions = async (packageReq, verReq) => {
  if (!packageReq || typeof packageReq !== 'object') {
    throw Error('Wrong packageReq: '+packageReq);
  }
  if (!packageReq.name) {
    throw Error('packageReq must contain a name property: '+packageReq);
  }
  // If verReq is not provided or invalid, default to all versions
  if (!verReq || semver.validRange(verReq)) {
    verReq = '*';
  }

  const {name} = packageReq;
  validate.isEthDomain(name); // Validate the provided name, it only accepts .eth domains

  const repo = await getRepoContract(name);
  if (!repo) {
    throw Error('Resolver could not found a match for ' + name);
  }
  const versionCount = await repo.getVersionsCount()
    .then((res) => res[0].toNumber());
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
      const verArray = await repo.getByVersionId(i)
        .then((res) => res.semanticVersion);
      // semanticVersion = [1, 0, 8]. It is joined to form a regular semver string
      const ver = verArray.join('.');
      // Append version result to the versions object
      if (semver.satisfies(ver, verReq)) {
        versions[ver] = await getSemanticVersion(repo, verArray);
      }
    } catch (e) {
      // If you request an inexistent ID to the contract, web3 will throw
      // Error: couldn't decode uint16 from ABI. The try, catch block will catch that
      // and log other errors
      if (String(e).includes('decode uint16 from ABI')) {
        logs.error('Attempting to fetch an inexistent version');
      } else {
        logs.error('Error getting versions of '+name+': '+e.stack);
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
