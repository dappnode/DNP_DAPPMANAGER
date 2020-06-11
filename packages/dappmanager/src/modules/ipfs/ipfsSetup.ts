const ipfsClient = require("ipfs-http-client");
import params from "../../params";
import { logs } from "../../logs";

export const timeoutMs = 30 * 1000;
/**
 * From https://github.com/sindresorhus/ky/blob/2f37c3f999efb36db9108893b8b3d4b3a7f5ec45/index.js#L127-L132
 */
export const TimeoutErrorKy = class TimeoutError extends Error {
  constructor() {
    super("Request timed out");
    this.name = "TimeoutError";
  }
};

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
  : ipfsClient(IPFS_HOST, { timeout: timeoutMs });

/**
 * Prevents web3 from executing to unit-testing.
 * It can result in infinite non-ending tests
 *
 * verify on the background, don't stop execution
 */
if (!process.env.TEST) {
  logs.info(`Attempting IPFS connection to: ${IPFS_HOST}`);
  ipfs.id((err: Error, identity: { id: string }) => {
    if (err)
      ipfs.version((err2: Error, version: IpfsHttpApiVersionReturn) => {
        if (err2) logs.error("Error checking IPFS connection", err2);
        else logs.info("Connected to IPFS", version);
      });
    else logs.info("Connected to IPFS", (identity || {}).id);
  });
}

export default ipfs;
