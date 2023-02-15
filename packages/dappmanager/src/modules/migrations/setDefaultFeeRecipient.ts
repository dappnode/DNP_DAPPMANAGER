import { ConsensusClient, Network } from "@dappnode/common";
import * as db from "../../db/index.js";
import { packageGet } from "../../calls/index.js";
import { listPackageNoThrow } from "../docker/list/listPackages.js";
import { getValidatorServiceName } from "../stakerConfig/utils.js";

/**
 * Sets the default global environment variable FEE_RECIPIENT_<NETWORK>
 * This global env var is used by the DAppNode packages to set the default fee recipient
 */
export async function setDefaultFeeRecipient(): Promise<void> {
  const networks: Network[] = [];

  if (db.feeRecipientPrater.get() === null) networks.push("prater");
  if (db.feeRecipientGnosis.get() === null) networks.push("gnosis");
  if (db.feeRecipientMainnet.get() === null) networks.push("mainnet");

  for (const network of networks) {
    const envVarName = `FEE_RECIPIENT_ADDRESS`;
    let consensusClientDnpName: ConsensusClient<Network> | null;
    let envVarValue = "";

    switch (network) {
      case "prater":
        consensusClientDnpName = db.consensusClientPrater.get();
        break;
      case "gnosis":
        consensusClientDnpName = db.consensusClientGnosis.get();
        break;
      case "mainnet":
        consensusClientDnpName = db.consensusClientMainnet.get();
        break;
      default:
        throw Error(`Unknown network ${network}`);
    }

    if (
      consensusClientDnpName &&
      (await listPackageNoThrow({ dnpName: consensusClientDnpName }))
    ) {
      envVarValue =
        (await packageGet({ dnpName: consensusClientDnpName })).userSettings
          ?.environment?.[getValidatorServiceName(consensusClientDnpName)][
          envVarName
        ] || "";
    }

    // Set default fee recipient, if no default value, set empty string to avoid triggereing this migration again
    if (network === "prater") db.feeRecipientPrater.set(envVarValue);
    if (network === "gnosis") db.feeRecipientGnosis.set(envVarValue);
    if (network === "mainnet") db.feeRecipientMainnet.set(envVarValue);
  }
}
