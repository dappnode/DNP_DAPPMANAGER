import {
  Network,
  StakerConfigSet,
  StakerItem,
  StakerItemOk,
  StakerType
} from "types";
import { isEqual, pick } from "lodash";

export function validateEthereumAddress(value?: string): string | null {
  if (value && !/^0x[0-9a-fA-F]{40}$/.test(value)) return "Invalid address";
  return null;
}

export function validateGraffiti(value?: string): string | null {
  // It must be not more than 32 characters long
  if (value && value.length > 32)
    return "Graffiti must be less than 32 characters";
  return null;
}

export function isOkSelectedInstalledAndRunning<
  T extends Network,
  P extends StakerType
>(StakerItem: StakerItem<T, P>): boolean {
  return (
    StakerItem.status === "ok" &&
    StakerItem.isSelected &&
    StakerItem.isInstalled &&
    StakerItem.isRunning
  );
}

/**
 * Returns if the changes are allowed to be set:
 * - At leaset EC and CC must be selected or none of them
 * - Any change in:
 *   - graffiti
 *   - fee recipient
 *   - checkpoint sync
 *   - CC/EC
 *   - Signer
 *   - MEV boost
 *   - MEV boost relays
 */
export function areChangesAllowed<T extends Network>({
  currentStakerConfig,
  feeRecipientError,
  graffitiError,
  newConsClient,
  newMevBoost,
  newEnableWeb3signer,
  newExecClient
}: {
  currentStakerConfig: StakerConfigSet<T>;
  feeRecipientError: string | null;
  graffitiError: string | null;
  newExecClient: StakerItemOk<T, "execution"> | undefined;
  newConsClient?: StakerItemOk<T, "consensus">;
  newMevBoost?: StakerItemOk<T, "mev-boost">;
  newEnableWeb3signer: boolean;
}): boolean {
  const {
    executionClient,
    consensusClient,
    mevBoost,
    enableWeb3signer
  } = currentStakerConfig;
  const isExecAndConsSelected = Boolean(newExecClient && newConsClient);
  const isExecAndConsDeSelected = Boolean(!newExecClient && !newConsClient);
  const isConsClientEqual = isEqual(
    pick(consensusClient, [
      "checkpointSync",
      "dnpName",
      "feeRecipient",
      "graffiti"
    ]),
    pick(newConsClient, [
      "checkpointSync",
      "dnpName",
      "feeRecipient",
      "graffiti"
    ])
  );
  const isMevBoostEqual = isEqual(
    pick(mevBoost, ["dnpName", "relays"]),
    pick(newMevBoost, ["dnpName", "relays"])
  );

  return (
    !feeRecipientError &&
    !graffitiError &&
    (isExecAndConsSelected || isExecAndConsDeSelected) &&
    (executionClient !== newExecClient ||
      !isConsClientEqual ||
      !isMevBoostEqual ||
      enableWeb3signer !== newEnableWeb3signer)
  );
}
