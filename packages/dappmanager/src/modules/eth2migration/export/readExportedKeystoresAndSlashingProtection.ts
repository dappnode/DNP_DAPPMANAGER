import { dappmanagerOutPaths } from "./params";
import fs from "fs";
import path from "path";

/**
 * Get eth2migration files from dappmanager volume to export them
 * to the web3signer container
 */
export function readExportedKeystoresAndSlashingProtection(): {
  keystoresStr: string[];
  keystorePasswordStr: string;
  slashingProtectionStr: string;
} {
  const keystoresStr: string[] = [];
  const keystorePaths = fs.readdirSync(dappmanagerOutPaths.keystoresOutDir);
  for (const keystoreFilename of keystorePaths) {
    const keystoreFilepath = path.join(
      dappmanagerOutPaths.keystoresOutDir,
      keystoreFilename
    );
    const file = fs.readFileSync(keystoreFilepath, "utf8");
    keystoresStr.push(JSON.stringify(JSON.parse(file)));
  }

  return {
    keystoresStr,
    keystorePasswordStr: fs
      .readFileSync(dappmanagerOutPaths.walletpasswordOutFilepath, "utf8")
      .trim(),
    slashingProtectionStr: JSON.stringify(
      JSON.parse(
        fs.readFileSync(
          dappmanagerOutPaths.slashingProtectionOutFilepath,
          "utf8"
        )
      )
    )
  };
}
