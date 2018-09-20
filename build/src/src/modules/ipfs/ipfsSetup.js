const ipfsAPI = require('ipfs-api');
const params = require('params');
const logs = require('logs.js')(module);

/**
 * IPFS client setup.
 *
 * Notice that this script takes advantatge of the singleton nature of nodejs imports.
 * The exported ipfs object will only be initialized once in the entire application.
 */

let ipfs;

/**
 * Prevents web3 from executing to unit-testing.
 * It can result in infinite non-ending tests
 */
if (!process.env.TEST) {
  ipfs = initIPFS();
}

function initIPFS() {
  if (process.env.NODE_ENV === 'development') {
    params.IPFS = '127.0.0.1';
  }
  const IPFS_HOST = params.IPFS;
  logs.info('Attempting IPFS connection to : '+IPFS_HOST);
  const ipfs = ipfsAPI(IPFS_HOST, '5001', {protocol: 'http'});
  // verify on the background, don't stop execution
  verifyIPFS(ipfs);
  return ipfs;
}

function verifyIPFS(ipfs) {
  ipfs.id((err, identity) => {
    if (err) {
      logs.error('IPFS ERROR: '+err.message);
    } else {
      logs.info('CONNECTED to DAppnode\'s IPFS '+
        '\n   ID '+(identity ? identity.id : 'UNKNOWN'));
    }
  });
}

module.exports = ipfs;
