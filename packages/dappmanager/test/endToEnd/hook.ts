import fetch from "node-fetch";
import { dappmanagerTestApiUrl, testDir } from "./endToEndUtils";
import fs from "fs";

export const mochaHooks = {
  beforeAll: [
    async function (): Promise<void> {
      console.log("=========================");
      console.log("Starting End to End tests");
      console.log("=========================");

      // Check health of test api calling /ping
      const res = await fetch(dappmanagerTestApiUrl + "/ping");
      if (res.status !== 200) throw Error("Test API not running");

      // Clean and create testDir
      if (fs.existsSync(testDir)) {
        fs.rmdirSync(testDir, { recursive: true });
        fs.mkdirSync(testDir);
      } else fs.mkdirSync(testDir);

      // TODO: Ensure the number of files inside the folder is the same as the number of functions
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
