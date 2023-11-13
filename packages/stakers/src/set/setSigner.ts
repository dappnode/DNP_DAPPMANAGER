import { InstalledPackageData } from "@dappnode/common";
import { packageInstall } from "@dappnode/installer";
import { logs } from "@dappnode/logger";
import { dockerComposeUpPackage } from "@dappnode/dockerapi";
import { stopAllPkgContainers } from "./stopAllPkgContainers.js";

export async function setSigner({
  web3signerDnpName,
  web3signerPkg,
  enableWeb3signer,
}: {
  web3signerDnpName: string;
  web3signerPkg: InstalledPackageData | undefined;
  enableWeb3signer?: boolean;
}): Promise<void> {
  // Web3signer installed and enable => make sure its running
  if (web3signerPkg && enableWeb3signer) {
    logs.info("Web3Signer is already installed");
    await dockerComposeUpPackage(
      { dnpName: web3signerPkg.dnpName },
      {},
      {},
      true
    ).catch((err) => logs.error(err));
  } // Web3signer installed and disabled => make sure its stopped
  else if (web3signerPkg && !enableWeb3signer) {
    await stopAllPkgContainers(web3signerPkg);
  } // Web3signer not installed and enable => make sure its installed
  else if (!web3signerPkg && enableWeb3signer) {
    logs.info("Installing Web3Signer");
    await packageInstall({ name: web3signerDnpName });
  }
}
