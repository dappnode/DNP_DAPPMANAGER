// node modules
const ipfsAPI = require('ipfs-api');
const params = require('params');
const logs = require('logs.js')(module);
let ipfs;

if (!process.env.TEST) {
  ipfs = initIPFS();
}

function initIPFS() {
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
