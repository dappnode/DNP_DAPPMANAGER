
const Web3 = require('web3');


function web3Setup(params) {
  const possibleWeb3Hosts = params.possibleWeb3Hosts;
  const WEB3HOSTWS = possibleWeb3Hosts[0];

  let web3 = new Web3(WEB3HOSTWS);

  setInterval(function() {
    web3.eth.net.isListening().then().catch((e) => {
      console.log('(14 web3Setup.js) Current web3 instance lost connection to node: ' + process.env.WEB3HOSTWS + ', reconnecting automatically');
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
