/* eslint-disable @typescript-eslint/no-explicit-any */
import params from "../../src/params";
import os from "os";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const printData = (data: any) => {
  try {
    console.log(`\ndata: ${JSON.stringify(data, null, 6)}`);
  } catch (e) {
    console.log(`\ndata: ${data}`);
  }
};

export const dappmanagerTestApiUrl = `http://172.33.1.7:${params.TEST_API_PORT}`;
export const testDir = `${os.homedir()}/actions-runner-test`;
