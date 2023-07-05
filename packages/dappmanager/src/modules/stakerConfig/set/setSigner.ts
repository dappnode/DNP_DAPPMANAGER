import { InstalledPackageDataApiReturn } from "@dappnode/common";
import { packageInstall } from "../../../calls/index.js";
import { logs } from "../../../logs.js";
import { dockerComposeUpPackage } from "../../docker/index.js";
import { stopAllPkgContainers } from "./stopAllPkgContainers.js";

export async function setSigner({
  enableWeb3signer,
  web3signerDnpName,
  web3signerPkg
}: {
  enableWeb3signer: boolean;
  web3signerDnpName: string;
  web3signerPkg: InstalledPackageDataApiReturn | undefined;
}): Promise<void> {
  // Web3signer installed and enable => make sure its running
  if (web3signerPkg && enableWeb3signer) {
    logs.info("Web3Signer is already installed");
    await dockerComposeUpPackage(
      { dnpName: web3signerPkg.dnpName },
      {},
      {},
      true
    ).catch(err => logs.error(err));
  } // Web3signer installed and disabled => make sure its stopped
  else if (web3signerPkg && !enableWeb3signer) {
    await stopAllPkgContainers(web3signerPkg);
  } // Web3signer not installed and enable => make sure its installed
  else if (!web3signerPkg && enableWeb3signer) {
    logs.info("Installing Web3Signer");
    await packageInstall({ name: web3signerDnpName });
  }
}
