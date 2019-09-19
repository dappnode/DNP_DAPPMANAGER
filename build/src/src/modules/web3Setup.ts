import Web3 from "web3";
import params from "../params";
import Logs from "../logs";
const logs = Logs(module);

// Prevent web3 from executing to testing. Can result in infinite non-ending tests

// Web3 does not accept a string as a provider
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const WEB3_HOST: any = params.WEB3_HOST;

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
