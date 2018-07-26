const shell = require('shelljs');
const logs = require('logs.js')(module);

function packageReq(packageReq) {
  if (!packageReq) throw Error('VALIDATION ERROR: packageReq is undefined');

  if (typeof(packageReq) != 'object') {
    throw Error('VALIDATION ERROR: packageReq is not an object, packageReq: '
      + JSON.stringify(packageReq));
    }

  if (!packageReq.hasOwnProperty('name')) {
    throw Error('VALIDATION ERROR: packageReq has no [name] key, packageReq: '
      + JSON.stringify(packageReq));
  }

  if (!packageReq.hasOwnProperty('ver')) {
    throw Error('VALIDATION ERROR: packageReq has no [ver] key, packageReq: '
      + JSON.stringify(packageReq));
  }
}


function isEthDomain(domain) {
  if (!domain) throw Error('VALIDATION ERROR: domain is undefined');

  if (typeof(domain) != 'string') {
    throw Error('VALIDATION ERROR: domain must be a string: ' + domain);
  }

  if (domain.substr(domain.length - 4) != '.eth') {
    logs.error('ERROR: reponame is not an .eth domain: ' + domain);
    throw Error('reponame is not an .eth domain: ' + domain);
  }
}


function isIPFShash(HASH) {
  if (!HASH) throw Error('VALIDATION ERROR: hash is undefined');

  return ((HASH.startsWith('/ipfs/Qm')
  || HASH.startsWith('ipfs/Qm')
  || HASH.startsWith('Qm')
  ) && !HASH.endsWith('.eth'));
}


function web3Existance(_web3) {
  if (!_web3) throw Error('VALIDATION ERROR: web3 is not defined');
}


async function web3Usability(_web3) {

  // Right now this function is empty as the code below
  // was very slow ocassionally > 1000 ms. The check if the chain is syncing
  // will be made directly in the ADMINUI
  // const isSyncing = await _web3.eth.isSyncing()
  // if (isSyncing) throw Error('Chain is still syncing, please wait until the chain is synced')
}


function path(PATH) {
  if (!PATH) throw Error('VALIDATION ERROR: path is not defined: '+PATH);
  if (typeof(PATH) != 'string') throw Error('VALIDATION ERROR: path must be a string ' + PATH);

  // shell.mkdir('-p', fullPath);
  // directory exists
  const PARENT_PATH = PATH.replace(/\/[^/]+\/?$/, '');
  if (!shell.test('-e', PARENT_PATH)) {
    shell.mkdir('-p', PARENT_PATH);
    logs.warn('Parent path doesn\'t exist, creating it.'
      +' pwd: ' + shell.pwd() + ' parent: ' + PARENT_PATH + '\n > creating it');
  }

  // returning so it can be used as
  // > await fs.writeFileSync(validate.path(PATH), data)
  return PATH;
}


module.exports = {
  packageReq,
  isEthDomain,
  web3Existance,
  web3Usability,
  isIPFShash,
  path,
};
