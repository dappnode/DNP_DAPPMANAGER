import fs from "fs";
import params from "../params";
import { logs } from "../logs";

const hostnamePath = params.HOSTNAME_PATH;
const defaultName = "DAppNode_server";

export default function getServerName(): string {
  try {
    const rawName = fs.readFileSync(hostnamePath, "utf-8");
    return rawName.trim() || defaultName;
  } catch (e) {
    if (e.code === "ENOENT") {
      logs.warn(`hostname not found at ${hostnamePath}: ${e.message}`);
    } else {
      logs.error(`Error reading hostname at ${hostnamePath}: ${e.message}`);
    }
    return defaultName;
  }
}
