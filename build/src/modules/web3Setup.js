
const Web3 = require('web3');


function web3Setup(params) {
  const WEB3HOSTWS = params.WEB3HOSTWS;

  let web3 = new Web3(WEB3HOSTWS);
  console.log('[web3Setup.js 9] Web3 connection to: ' + WEB3HOSTWS);

  setInterval(function() {
    web3.eth.net.isListening().then().catch((e) => {
      console.log('[web3Setup.js 13] Current web3 instance lost connection to node: ' + WEB3HOSTWS + ', reconnecting automatically');
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
