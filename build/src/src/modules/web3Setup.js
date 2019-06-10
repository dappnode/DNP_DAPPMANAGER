const Web3 = require("web3");
const logs = require("logs.js")(module);
const params = require("params");

let web3;

// Prevent web3 from executing to testing. Can result in infinite non-ending tests
if (!process.env.TEST) {
  web3 = web3Setup();
}

function web3Setup() {
  if (process.env.NODE_ENV === "development") {
    params.WEB3_HOST_WS =
      "https://mainnet.infura.io/v3/bb15bacfcdbe45819caede241dcf8b0d";
  }
  const WEB3_HOST_WS = process.env.WEB3_HOST_WS || params.WEB3_HOST_WS;
  if (!WEB3_HOST_WS)
    throw Error(
      "WEB3_HOST_WS is needed to connect to ethchain but it's undefined"
    );

  let web3 = new Web3(WEB3_HOST_WS);
  logs.info(`Web3 connection to: ${WEB3_HOST_WS}`);

  const webWatch = setInterval(function() {
    web3.eth.net
      .isListening()
      .then()
      .catch(e => {
        logs.error(`Web3 connection error to ${WEB3_HOST_WS}: ${e.message}`);
        web3.setProvider(WEB3_HOST_WS);
      });
  }, 10000);

  web3.clearWatch = () => clearInterval(webWatch);

  return web3;
}

module.exports = web3;
