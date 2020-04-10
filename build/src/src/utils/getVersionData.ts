import fs from "fs";
import { PackageVersionData } from "../types";
import Logs from "../logs";
const logs = Logs(module);

const VERSION_DATA_FILE = "/usr/src/app/.version.json";
const versionDataJsonPath = VERSION_DATA_FILE;

/**
 * For debugging, print current version, branch and commit
 * { "version": "0.1.21",
 *   "branch": "master",
 *   "commit": "ab991e1482b44065ee4d6f38741bd89aeaeb3cec" }
 *
 * Data is read from disk only once at start-up
 */
let versionData: PackageVersionData = {};
try {
  if (!fs.existsSync(versionDataJsonPath)) {
    logs.warn(`Version info not found at path: ${versionDataJsonPath}`);
  } else {
    versionData = JSON.parse(fs.readFileSync(versionDataJsonPath, "utf8"));
    logs.info(`Version info: \n${JSON.stringify(versionData, null, 2)}`);
  }
} catch (e) {
  logs.error(`Error printing current version ${e.message}`);
}

export default versionData;
