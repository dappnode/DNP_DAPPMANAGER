// node modules
const ipfsAPI = require('ipfs-api');

// dedicated modules
const params = require('../../../params')

const IPFS = params.IPFS;
const ipfs = ipfsAPI(IPFS, '5001', { protocol: 'http' });

module.exports = ipfs;

// In the event that the IPFS node is not connected,
// this function will throw and error.

verifyIPFS()

function verifyIPFS() {
  ipfs.id(function (err, identity) {
    if (err) {
      throw err
    }
    console.log("CONNECTED to DAppnode's IPFS "+
      "\n   ID "+identity.id);
  })
}
