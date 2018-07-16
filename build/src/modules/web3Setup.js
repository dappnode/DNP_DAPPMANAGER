
const Web3 = require('web3');
const logs = require('../logs.js')(module);


function web3Setup(params) {
  const WEB3HOSTWS = params.WEB3HOSTWS;
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


module.exports = web3Setup;
