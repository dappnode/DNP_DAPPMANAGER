
const Web3 = require('web3');
const logs = require('logs.js')(module);
const paramsDefault = require('params');

function web3Setup({
  params = paramsDefault,
}) {
  const WEB3HOSTWS = process.env.WEB3HOSTWS || params.WEB3HOSTWS;
  if (!WEB3HOSTWS) throw Error('WEB3HOSTWS is needed to connect to ethchain but it\'s undefined');

  let web3 = new Web3(WEB3HOSTWS);
  logs.info('Web3 connection to: ' + WEB3HOSTWS);

  setInterval(function() {
    web3.eth.net.isListening().then().catch((e) => {
      logs.error('Web3 connection error to '+WEB3HOSTWS+': ', e.message);
      web3.setProvider(WEB3HOSTWS);
    });
  }, 10000);

  return web3;

  // testWeb3Host(WEB3HOSTWS).then((res) => {
  //   if (!res.works) {
  //     throw Error(WEB3HOSTWS + ' DOES NOT work, reason: '+res.reason)
  //   }
  //
  // })
}

// A singleton enforces one ipfs instance for the whole application
// See that if you want to pass non-default parameters in a full application
// context, there will be a race condition. Non-default parameters should only
// be passed through testing are make those parameters process.env variables
const web3Singleton = (() => {
  let web3;
  return (kwargs) => web3 ? web3 : web3 = web3Setup(kwargs);
})();

module.exports = web3Singleton;
