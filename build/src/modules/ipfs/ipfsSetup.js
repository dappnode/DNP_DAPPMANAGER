// node modules
const ipfsAPI = require('ipfs-api');
const paramsDefault = require('../../params');

function ipfsSetup({
  params = paramsDefault,
}) {
  const IPFS = params.IPFS;
  console.log('[ipfsSetup.js 6] ipfs connection to : '+IPFS);
  const ipfs = ipfsAPI(IPFS, '5001', {protocol: 'http'});
  // verify on the background, don't stop execution
  // verifyIPFS(ipfs);
  return ipfs;
}

function verifyIPFS(ipfs) {
  ipfs.id(function(err, identity) {
    if (err) {
      console.trace('[ipfsSetup.js 15] IPFS ERROR: '+err.message);
    } else {
      console.log('[ipfsSetup.js 17] CONNECTED to DAppnode\'s IPFS '+
        '\n   ID '+(identity ? identity.id : 'UNKNOWN'));
    }
  });
}

module.exports = ipfsSetup;
