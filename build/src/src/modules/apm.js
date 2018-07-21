// node modules
const semver = require('semver');

// dedicated modules
const logs = require('../logs.js')(module);
const validate = require('../utils/validate');

const ensContract = require('../contracts/ens.json');
const publicResolverContract = require('../contracts/publicResolver.json');
const repoContract = require('../contracts/ens.json');

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


async function getRepoContract(reponame, web3) {
    const ens = new web3.eth.Contract(ensContract.abi, ensContract.address);
    const resolverAddress = await ens.methods.resolver(namehash(reponame, web3)).call();

    if (resolverAddress == '0x0000000000000000000000000000000000000000')
      {return;}

    const resolver = new web3.eth.Contract(publicResolverContract.abi, resolverAddress);
    const repoAddr = await resolver.methods.addr(namehash(reponame, web3)).call();
    return new web3.eth.Contract(repoContract.abi, repoAddr);
}

async function getLatestVersion(repo, web3) {
    validate.web3Existance(web3);
    const latest = await repo.methods.getLatest()
    .call()
    .then(function(result) {
        return web3.utils.hexToAscii(result.contentURI);
    })
    .catch((err) => {
        throw Error(err);
    });
    return latest;
}

async function getSemanticVersion(repo, version, web3) {
    validate.web3Existance(web3);

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
}


// /////////////  getRepoHash
// /////////////  getRepoHash
// /////////////  getRepoHash
// /////////////  getRepoHash
// /////////////  getRepoHash


function createGetRepoHash(web3) {
  validate.web3Existance(web3);

  return async function getRepoHash(packageReq) {
    // verify that chain is synched and usable
    await validate.web3Usability(web3);

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
}


// ////////////  getRepoVersions
// ////////////  getRepoVersions
// ////////////  getRepoVersions
// ////////////  getRepoVersions
// ////////////  getRepoVersions
// ////////////  getRepoVersions


function createGetRepoVersions(web3) {
  validate.web3Existance(web3);

  return async function getRepoVersions(packageReq) {
    // verify that chain is synched and usable
    await validate.web3Usability(web3);

    validate.packageReq(packageReq);
    const NAME = packageReq.name;
    validate.isEthDomain(NAME); // Validate the provided name, it only accepts .eth domains

    let repo = await getRepoContract(NAME, web3);
    if (!repo) {
      throw Error('Resolver could not found a match for ' + NAME);
    }

    return getVersions(repo, web3);
  };
}


async function getVersions(repo, web3) {
  let versionCount = parseFloat(await repo.methods.getVersionsCount().call());
  let versions = [];
  for (let i = 1; i <= versionCount; i++) {
    // If you request an inexistent ID to the contract, web3 will throw
    // Error: couldn't decode uint16 from ABI. The try, catch block will catch that
    // and log other errors
    try {
      let res = await repo.methods.getByVersionId(i).call();
      let version = res.semanticVersion;
      let hash = await getSemanticVersion(repo, version, web3);
      versions.push({
        version: version.join('.'),
        manifestHash: hash,
      });
    }
    catch (error) {
      if (String(error).includes('decode uint16 from ABI')) {
        logs.error('Attempting to fetch an inexistent version');
      } else {
        logs.error(error);
      }
    }
  }
  return versions;
}


function createAPM(web3) {
  return {
    getRepoVersions: createGetRepoVersions(web3),
    getRepoHash: createGetRepoHash(web3),
  };
}


module.exports = createAPM;
