import { packageInstall } from "../../calls";
import { logs } from "../../logs";
import { listPackageNoThrow } from "../docker/list";

export async function ensureEth2ClientIsInstalledAndSynced({
  dnpName
}: {
  dnpName: string;
}): Promise<void> {
  // If Prysm ensure it's the "new" version, that works with web3 signer

  const dnp = await listPackageNoThrow({ dnpName });
  if (!dnp) {
    logs.info(
      `Eth2 migration: eth2 client not installed ${dnpName}, installing it`
    );
    await packageInstall({ name: dnpName });
  }

  // TODO: Check it is synced
}
