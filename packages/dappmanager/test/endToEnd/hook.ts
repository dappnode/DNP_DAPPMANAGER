import fetch from "node-fetch";
import { dappmanagerTestApiUrl, testDir } from "./endToEndUtils";
import fs from "fs";

export const mochaHooks = {
  beforeAll: [
    async function (): Promise<void> {
      console.log("=========================");
      console.log("Starting End to End tests");
      console.log("=========================");

      // TODO: install the dappmanager source code via test API

      // Check health of test api calling /ping
      const res = await fetch(dappmanagerTestApiUrl + "/ping");
      if (res.status !== 200) throw Error("Test API not running");

      // Clean and create testDir
      if (fs.existsSync(testDir)) {
        fs.rmdirSync(testDir, { recursive: true });
        fs.mkdirSync(testDir);
      } else fs.mkdirSync(testDir);

      // Ensure the number of files inside the folder is the same as the number of functions
      const numberOfApiCallsTests = fs.readdirSync(
        __dirname + "/apiCalls"
      ).length;
      const numberOfApiCallFiles = fs
        .readdirSync("./src/calls")
        .filter(
          item => !fs.lstatSync("./src/calls/" + item).isDirectory()
        ).length;
      // minus 1 because of index.ts
      if (numberOfApiCallsTests !== numberOfApiCallFiles - 1)
        throw Error(
          `Number of API calls tests (${numberOfApiCallsTests}) does not match the number of API call files (${numberOfApiCallFiles})`
        );
    }
  ],
  afterAll: [
    async function (): Promise<void> {
      if (fs.existsSync(testDir)) fs.rmdirSync(testDir, { recursive: true });
      console.log("=========================");
      console.log("Finsihed End to End tests");
      console.log("=========================");
    }
  ]
};
