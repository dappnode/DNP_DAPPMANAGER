// node modules
const ipfsAPI = require('ipfs-api');
const paramsDefault = require('params');
const logs = require('logs.js')(module);

function ipfsSetup({
  params = paramsDefault,
}) {
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

// A singleton enforces one ipfs instance for the whole application
// See that if you want to pass non-default parameters in a full application
// context, there will be a race condition. Non-default parameters should only
// be passed through testing are make those parameters process.env variables
const ipfsSingleton = (() => {
  let ipfs;
  return (kwargs) => ipfs ? ipfs : ipfs = ipfsSetup(kwargs);
})();

module.exports = ipfsSingleton;
