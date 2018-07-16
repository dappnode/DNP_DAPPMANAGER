// node modules
const semver = require('semver');

// dedicated modules
const validate = require('../utils/validate');


const ensAddr = '0x314159265dD8dbb310642f98f50C066173C1259b';
const ensAbi = [{'constant': true, 'inputs': [{'name': 'node', 'type': 'bytes32'}], 'name': 'resolver', 'outputs': [{'name': '', 'type': 'address'}], 'payable': false, 'type': 'function'}, {'constant': true, 'inputs': [{'name': 'node', 'type': 'bytes32'}], 'name': 'owner', 'outputs': [{'name': '', 'type': 'address'}], 'payable': false, 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'node', 'type': 'bytes32'}, {'name': 'label', 'type': 'bytes32'}, {'name': 'owner', 'type': 'address'}], 'name': 'setSubnodeOwner', 'outputs': [], 'payable': false, 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'node', 'type': 'bytes32'}, {'name': 'ttl', 'type': 'uint64'}], 'name': 'setTTL', 'outputs': [], 'payable': false, 'type': 'function'}, {'constant': true, 'inputs': [{'name': 'node', 'type': 'bytes32'}], 'name': 'ttl', 'outputs': [{'name': '', 'type': 'uint64'}], 'payable': false, 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'node', 'type': 'bytes32'}, {'name': 'resolver', 'type': 'address'}], 'name': 'setResolver', 'outputs': [], 'payable': false, 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'node', 'type': 'bytes32'}, {'name': 'owner', 'type': 'address'}], 'name': 'setOwner', 'outputs': [], 'payable': false, 'type': 'function'}, {'anonymous': false, 'inputs': [{'indexed': true, 'name': 'node', 'type': 'bytes32'}, {'indexed': false, 'name': 'owner', 'type': 'address'}], 'name': 'Transfer', 'type': 'event'}, {'anonymous': false, 'inputs': [{'indexed': true, 'name': 'node', 'type': 'bytes32'}, {'indexed': true, 'name': 'label', 'type': 'bytes32'}, {'indexed': false, 'name': 'owner', 'type': 'address'}], 'name': 'NewOwner', 'type': 'event'}, {'anonymous': false, 'inputs': [{'indexed': true, 'name': 'node', 'type': 'bytes32'}, {'indexed': false, 'name': 'resolver', 'type': 'address'}], 'name': 'NewResolver', 'type': 'event'}, {'anonymous': false, 'inputs': [{'indexed': true, 'name': 'node', 'type': 'bytes32'}, {'indexed': false, 'name': 'ttl', 'type': 'uint64'}], 'name': 'NewTTL', 'type': 'event'}];
const publicResolverAbi = [{'constant': true, 'inputs': [{'name': 'interfaceID', 'type': 'bytes4'}], 'name': 'supportsInterface', 'outputs': [{'name': '', 'type': 'bool'}], 'payable': false, 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'node', 'type': 'bytes32'}, {'name': 'key', 'type': 'string'}, {'name': 'value', 'type': 'string'}], 'name': 'setText', 'outputs': [], 'payable': false, 'type': 'function'}, {'constant': true, 'inputs': [{'name': 'node', 'type': 'bytes32'}, {'name': 'contentTypes', 'type': 'uint256'}], 'name': 'ABI', 'outputs': [{'name': 'contentType', 'type': 'uint256'}, {'name': 'data', 'type': 'bytes'}], 'payable': false, 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'node', 'type': 'bytes32'}, {'name': 'x', 'type': 'bytes32'}, {'name': 'y', 'type': 'bytes32'}], 'name': 'setPubkey', 'outputs': [], 'payable': false, 'type': 'function'}, {'constant': true, 'inputs': [{'name': 'node', 'type': 'bytes32'}], 'name': 'content', 'outputs': [{'name': 'ret', 'type': 'bytes32'}], 'payable': false, 'type': 'function'}, {'constant': true, 'inputs': [{'name': 'node', 'type': 'bytes32'}], 'name': 'addr', 'outputs': [{'name': 'ret', 'type': 'address'}], 'payable': false, 'type': 'function'}, {'constant': true, 'inputs': [{'name': 'node', 'type': 'bytes32'}, {'name': 'key', 'type': 'string'}], 'name': 'text', 'outputs': [{'name': 'ret', 'type': 'string'}], 'payable': false, 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'node', 'type': 'bytes32'}, {'name': 'contentType', 'type': 'uint256'}, {'name': 'data', 'type': 'bytes'}], 'name': 'setABI', 'outputs': [], 'payable': false, 'type': 'function'}, {'constant': true, 'inputs': [{'name': 'node', 'type': 'bytes32'}], 'name': 'name', 'outputs': [{'name': 'ret', 'type': 'string'}], 'payable': false, 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'node', 'type': 'bytes32'}, {'name': 'name', 'type': 'string'}], 'name': 'setName', 'outputs': [], 'payable': false, 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'node', 'type': 'bytes32'}, {'name': 'hash', 'type': 'bytes32'}], 'name': 'setContent', 'outputs': [], 'payable': false, 'type': 'function'}, {'constant': true, 'inputs': [{'name': 'node', 'type': 'bytes32'}], 'name': 'pubkey', 'outputs': [{'name': 'x', 'type': 'bytes32'}, {'name': 'y', 'type': 'bytes32'}], 'payable': false, 'type': 'function'}, {'constant': false, 'inputs': [{'name': 'node', 'type': 'bytes32'}, {'name': 'addr', 'type': 'address'}], 'name': 'setAddr', 'outputs': [], 'payable': false, 'type': 'function'}, {'inputs': [{'name': 'ensAddr', 'type': 'address'}], 'payable': false, 'type': 'constructor'}, {'anonymous': false, 'inputs': [{'indexed': true, 'name': 'node', 'type': 'bytes32'}, {'indexed': false, 'name': 'a', 'type': 'address'}], 'name': 'AddrChanged', 'type': 'event'}, {'anonymous': false, 'inputs': [{'indexed': true, 'name': 'node', 'type': 'bytes32'}, {'indexed': false, 'name': 'hash', 'type': 'bytes32'}], 'name': 'ContentChanged', 'type': 'event'}, {'anonymous': false, 'inputs': [{'indexed': true, 'name': 'node', 'type': 'bytes32'}, {'indexed': false, 'name': 'name', 'type': 'string'}], 'name': 'NameChanged', 'type': 'event'}, {'anonymous': false, 'inputs': [{'indexed': true, 'name': 'node', 'type': 'bytes32'}, {'indexed': true, 'name': 'contentType', 'type': 'uint256'}], 'name': 'ABIChanged', 'type': 'event'}, {'anonymous': false, 'inputs': [{'indexed': true, 'name': 'node', 'type': 'bytes32'}, {'indexed': false, 'name': 'x', 'type': 'bytes32'}, {'indexed': false, 'name': 'y', 'type': 'bytes32'}], 'name': 'PubkeyChanged', 'type': 'event'}, {'anonymous': false, 'inputs': [{'indexed': true, 'name': 'node', 'type': 'bytes32'}, {'indexed': true, 'name': 'indexedKey', 'type': 'string'}, {'indexed': false, 'name': 'key', 'type': 'string'}], 'name': 'TextChanged', 'type': 'event'}];
const repoAbi = [{'constant': true, 'inputs': [{'name': '_semanticVersion', 'type': 'uint16[3]'}], 'name': 'getBySemanticVersion', 'outputs': [{'name': 'semanticVersion', 'type': 'uint16[3]'}, {'name': 'contractAddress', 'type': 'address'}, {'name': 'contentURI', 'type': 'bytes'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'EVMSCRIPT_REGISTRY_APP_ID', 'outputs': [{'name': '', 'type': 'bytes32'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': false, 'inputs': [{'name': '_newSemanticVersion', 'type': 'uint16[3]'}, {'name': '_contractAddress', 'type': 'address'}, {'name': '_contentURI', 'type': 'bytes'}], 'name': 'newVersion', 'outputs': [], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'function'}, {'constant': true, 'inputs': [{'name': '_versionId', 'type': 'uint256'}], 'name': 'getByVersionId', 'outputs': [{'name': 'semanticVersion', 'type': 'uint16[3]'}, {'name': 'contractAddress', 'type': 'address'}, {'name': 'contentURI', 'type': 'bytes'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'appId', 'outputs': [{'name': '', 'type': 'bytes32'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'getInitializationBlock', 'outputs': [{'name': '', 'type': 'uint256'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': true, 'inputs': [{'name': '_contractAddress', 'type': 'address'}], 'name': 'getLatestForContractAddress', 'outputs': [{'name': 'semanticVersion', 'type': 'uint16[3]'}, {'name': 'contractAddress', 'type': 'address'}, {'name': 'contentURI', 'type': 'bytes'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'EVMSCRIPT_REGISTRY_APP', 'outputs': [{'name': '', 'type': 'bytes32'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': true, 'inputs': [{'name': '_sender', 'type': 'address'}, {'name': '_role', 'type': 'bytes32'}, {'name': 'params', 'type': 'uint256[]'}], 'name': 'canPerform', 'outputs': [{'name': '', 'type': 'bool'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': true, 'inputs': [{'name': '_oldVersion', 'type': 'uint16[3]'}, {'name': '_newVersion', 'type': 'uint16[3]'}], 'name': 'isValidBump', 'outputs': [{'name': '', 'type': 'bool'}], 'payable': false, 'stateMutability': 'pure', 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'CREATE_VERSION_ROLE', 'outputs': [{'name': '', 'type': 'bytes32'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'getLatest', 'outputs': [{'name': 'semanticVersion', 'type': 'uint16[3]'}, {'name': 'contractAddress', 'type': 'address'}, {'name': 'contentURI', 'type': 'bytes'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'getVersionsCount', 'outputs': [{'name': '', 'type': 'uint256'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'kernel', 'outputs': [{'name': '', 'type': 'address'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': true, 'inputs': [{'name': '_script', 'type': 'bytes'}], 'name': 'getExecutor', 'outputs': [{'name': '', 'type': 'address'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'anonymous': false, 'inputs': [{'indexed': false, 'name': 'versionId', 'type': 'uint256'}, {'indexed': false, 'name': 'semanticVersion', 'type': 'uint16[3]'}], 'name': 'NewVersion', 'type': 'event'}];


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
    const ens = new web3.eth.Contract(ensAbi, ensAddr);
    const resolverAddress = await ens.methods.resolver(namehash(reponame, web3)).call();

    if (resolverAddress == '0x0000000000000000000000000000000000000000')
      {return;}

    const resolver = new web3.eth.Contract(publicResolverAbi, resolverAddress);
    const repoAddr = await resolver.methods.addr(namehash(reponame, web3)).call();
    return new web3.eth.Contract(repoAbi, repoAddr);
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
    const VERSION = packageReq.ver;
    validate.isEthDomain(NAME); // Validate the provided name, it only accepts .eth domains

    let repo = await getRepoContract(NAME, web3);
    if (!repo) {
      throw Error('Resolver could not found a match for ' + name);
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
        console.trace('Attempting to fetch an inexistent version');
      } else {
        console.error(error);
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
