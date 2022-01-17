import { packageInstall } from "../../../calls";
import { logs } from "../../../logs";
import { listPackageNoThrow } from "../../docker/list";
import { Eth2Client } from "../params";
import semver from "semver";

/**
 * Ensures:
 * - eth2client installed
 * - eth2client synced
 * @param param0
 */
export async function ensureEth2ClientIsInstalledAndSynced({
  dnpName,
  client,
  prysmWeb3signerVersion
}: {
  dnpName: string;
  client: Eth2Client;
  prysmWeb3signerVersion: string;
}): Promise<void> {
  const dnp = await listPackageNoThrow({ dnpName });

  // If Prysm ensure it's the "new" version, that works with web3 signer else install eth2client
  if (client === "prysm") {
    if (dnp && semver.gte(dnp.version, prysmWeb3signerVersion))
      logs.info("Prysm satifies web3signer version");
    else {
      logs.info(
        `Updating Prysm legacy to Prysm-web3signer (${prysmWeb3signerVersion})`
      );
      await packageInstall({ name: dnpName, version: prysmWeb3signerVersion });
    }
  } else {
    if (!dnp) {
      logs.info(
        `Eth2 migration: eth2 client not installed ${dnpName}, installing it`
      );
      await packageInstall({ name: dnpName });
    }
  }

  // TODO: Check it is synced
  // - prysm?
  // - teku
  // - lighthouse
}
