
const Web3 = require('web3')


function web3Setup(params) {

  const possibleWeb3Hosts = params.possibleWeb3Hosts
  const WEB3HOSTWS = possibleWeb3Hosts[0]

  var web3 = new Web3(WEB3HOSTWS)

  setInterval(function () {
    web3.eth.net.isListening().then().catch(e => {
      console.log('(14 web3Setup.js) Current web3 instance lost connection to node: ' + process.env.WEB3HOSTWS + ', reconnecting automatically');
      web3.setProvider(WEB3HOSTWS);
    })
  }, 10000)

  return web3

  // testWeb3Host(WEB3HOSTWS).then((res) => {
  //   if (!res.works) {
  //     throw Error(WEB3HOSTWS + ' DOES NOT work, reason: '+res.reason)
  //   }
  //
  // })

}


function testWeb3Host(web3Host) {
  return new Promise(function(resolve, reject) {
    var _web3 = new Web3(web3Host);
    _web3.eth.isSyncing()
    .then(function(isSyncing){
      if (isSyncing) {
        return resolve({
          works: false,
          reason: 'still syncing'
        })
      } else {
        return resolve({
          works: true,
          reason: ''
        })
      }
    })
    .catch(function(err){
      return resolve({
        works: false,
        reason: err
      })
    });
  });
}


module.exports = web3Setup
