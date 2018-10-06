const Eth = require('ethjs');
const logs = require('logs.js')(module);
const params = require('params');

let eth;

// Prevent web3 from executing to testing. Can result in infinite non-ending tests
// if (!process.env.TEST) {
// NOT NECESSARY as currently Eth consumes an Http provider

const httpProvider = process.env.NODE_ENV === 'development' || process.env.INFURA
  ? 'https://mainnet.infura.io/v3/bb15bacfcdbe45819caede241dcf8b0d'
  : params.WEB3HOSTHTTP;
eth = new Eth(new Eth.HttpProvider(httpProvider));
logs.info(`Connecting eth.js to ${httpProvider}`);

// Export utils to the eth object
for (const utilName of [
  'isAddress',
  'fromWei',
  'toWei',
  'fromAscii',
  'toAscii',
  'fromUtf8',
  'toUtf8',
]) {
  eth[utilName] = Eth[utilName];
}


module.exports = eth;
