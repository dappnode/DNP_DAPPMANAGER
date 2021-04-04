import fs from "fs";
import path from "path";
import params from "../../params";
import { sha256File } from "../hostScripts";
import { logs } from "../../logs";

export async function copyHostServices(): Promise<void> {
  // Check if dir exists
  // systemd is the default init system for debian since DebainJessie
  // https://wiki.debian.org/systemd
  if (!fs.existsSync(params.HOST_SERVICES_DIR)) {
    logs.warn(
      `copyHostServices cannot copy services, dir ${params.HOST_SERVICES_DIR} does not exist`
    );
    return;
  }

  // Fetch list of scripts to diff them
  const newServices = fs.readdirSync(params.HOST_SERVICES_SOURCE_DIR);
  const copied: string[] = [];

  // Compute files to add
  for (const name of newServices) {
    const destPath = path.join(params.HOST_SERVICES_SOURCE_DIR, name);
    const srcPath = path.join(params.HOST_SERVICES_DIR, name);
    if (sha256File(destPath) !== sha256File(srcPath)) {
      fs.copyFileSync(destPath, srcPath);
      copied.push(name);
    }
  }

  let message = "Successfully run copyHostServices.";
  if (copied.length) message += ` Copied ${copied.join(", ")}.`;
  logs.info(message);
}
