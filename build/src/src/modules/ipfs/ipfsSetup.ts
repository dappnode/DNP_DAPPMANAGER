const ipfsAPI = require("ipfs-http-client");
import params from "../../params";
import Logs from "../../logs";
const logs = Logs(module);

interface IpfsHttpApiVersionReturn {
  Commit: string;
  Golang: string;
  Repo: string;
  System: string;
  Version: string;
}

/**
 * IPFS client setup.
 *
 * Notice that this script takes advantatge of the singleton nature of nodejs imports.
 * The exported ipfs object will only be initialized once in the entire application.
 */
const IPFS_HOST = params.IPFS_HOST;
const ipfs = process.env.TEST
  ? {}
  : ipfsAPI(IPFS_HOST, "5001", {
      protocol: process.env.IPFS_PROTOCOL || "http"
    });

/**
 * Prevents web3 from executing to unit-testing.
 * It can result in infinite non-ending tests
 *
 * verify on the background, don't stop execution
 */
if (!process.env.TEST) {
  logs.info(`Attempting IPFS connection to : ${IPFS_HOST}`);
  ipfs.id((err: Error, identity: { id: string }) => {
    if (err)
      ipfs.version((err2: Error, version: IpfsHttpApiVersionReturn) => {
        if (err2) logs.error(`IPFS error: ${err2.message}`);
        else logs.info(`Connected to IPFS ${JSON.stringify(version, null, 2)}`);
      });
    else logs.info(`Connected to IPFS ${(identity || {}).id}`);
  });
}

export default ipfs;
