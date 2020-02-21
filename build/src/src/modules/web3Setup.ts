import Web3 from "web3";
import params from "../params";
import Logs from "../logs";
const logs = Logs(module);

// Prevent web3 from executing to testing. Can result in infinite non-ending tests

// Web3 does not accept a string as a provider
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const WEB3_HOST: any = params.WEB3_HOST;

if (!process.env.TEST) {
  if (!WEB3_HOST) throw Error("No WEB3_HOST provided");
  logs.info(`Web3 connection to: ${WEB3_HOST}`);
}

const web3 = process.env.TEST ? ({} as Web3) : new Web3(WEB3_HOST);

export default web3;
