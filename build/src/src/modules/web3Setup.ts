import Web3 from "web3";
import params from "../params";
const logs = require("../logs")(module);

// Prevent web3 from executing to testing. Can result in infinite non-ending tests

const WEB3_HOST: any =
  process.env.WEB3_HOST_WS ||
  (process.env.NODE_ENV === "development"
    ? "https://mainnet.infura.io/v3/bb15bacfcdbe45819caede241dcf8b0d"
    : params.WEB3_HOST_WS);

if (WEB3_HOST === undefined || WEB3_HOST === null)
  throw Error("WEB3_HOST is needed to connect to ethchain but it's undefined");

const web3 = process.env.TEST ? ({} as Web3) : new Web3(WEB3_HOST);

if (!process.env.TEST) {
  logs.info(`Web3 connection to: ${WEB3_HOST}`);
  setInterval(() => {
    web3.eth.net.isListening().catch((e: Error) => {
      logs.error(`Web3 connection error to ${WEB3_HOST}: ${e.message}`);
      web3.setProvider(WEB3_HOST);
    });
  }, 10000);
}

export default web3;
