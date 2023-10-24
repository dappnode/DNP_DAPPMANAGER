import { GlobalEnvsPrefixed, GlobalEnvs } from "@dappnode/common";
import { staticIp, domain, dyndnsIdentity, publicIp } from "./dyndns.js";
import { internalIp, noNatLoopback } from "./network.js";
import { opEnableHistoricalRpc, opExecutionClient } from "./optimismConfig.js";
import {
  consensusClientMainnet,
  executionClientMainnet,
  feeRecipientMainnet,
  consensusClientGnosis,
  executionClientGnosis,
  mevBoostGnosis,
  feeRecipientGnosis,
  consensusClientPrater,
  executionClientPrater,
  feeRecipientLukso,
  consensusClientLukso,
  executionClientLukso,
  mevBoostLukso,
  mevBoostMainnet,
  mevBoostPrater,
} from "./stakerConfig.js";
import { serverName } from "./system.js";
import { upnpAvailable } from "./upnp.js";
import { params } from "@dappnode/params";
import { writeEnvFile } from "@dappnode/utils";

export const globalEnvsFilePath = params.GLOBAL_ENVS_PATH;

/**
 * Compute global ENVs from DB values
 */
export function computeGlobalEnvsFromDb<B extends boolean>(
  prefixed: B
): B extends true ? GlobalEnvsPrefixed : GlobalEnvs {
  const prefix = prefixed ? "_DAPPNODE_GLOBAL_" : "";
  return {
    [`${prefix}ACTIVE`]: "true",
    [`${prefix}INTERNAL_IP`]: internalIp.get(),
    [`${prefix}STATIC_IP`]: staticIp.get(),
    [`${prefix}HOSTNAME`]: staticIp.get() || domain.get(),
    [`${prefix}UPNP_AVAILABLE`]: upnpAvailable.get() ? "true" : "false",
    [`${prefix}NO_NAT_LOOPBACK`]: noNatLoopback.get() ? "true" : "false",
    [`${prefix}DOMAIN`]: domain.get(),
    [`${prefix}PUBKEY`]: dyndnsIdentity.get().publicKey,
    [`${prefix}ADDRESS`]: dyndnsIdentity.get().address,
    [`${prefix}PUBLIC_IP`]: publicIp.get(),
    [`${prefix}SERVER_NAME`]: serverName.get(),
    [`${prefix}CONSENSUS_CLIENT_MAINNET`]: consensusClientMainnet.get(),
    [`${prefix}EXECUTION_CLIENT_MAINNET`]: executionClientMainnet.get(),
    [`${prefix}MEVBOOST_MAINNET`]: mevBoostMainnet.get(),
    [`${prefix}FEE_RECIPIENT_MAINNET`]: feeRecipientMainnet.get(),
    [`${prefix}CONSENSUS_CLIENT_GNOSIS`]: consensusClientGnosis.get(),
    [`${prefix}EXECUTION_CLIENT_GNOSIS`]: executionClientGnosis.get(),
    [`${prefix}MEVBOOST_GNOSIS`]: mevBoostGnosis.get(),
    [`${prefix}FEE_RECIPIENT_GNOSIS`]: feeRecipientGnosis.get(),
    [`${prefix}CONSENSUS_CLIENT_PRATER`]: consensusClientPrater.get(),
    [`${prefix}EXECUTION_CLIENT_PRATER`]: executionClientPrater.get(),
    [`${prefix}MEVBOOST_PRATER`]: mevBoostPrater.get(),
    [`${prefix}FEE_RECIPIENT_PRATER`]: feeRecipientLukso.get(),
    [`${prefix}CONSENSUS_CLIENT_LUKSO`]: consensusClientLukso.get(),
    [`${prefix}EXECUTION_CLIENT_LUKSO`]: executionClientLukso.get(),
    [`${prefix}MEVBOOST_LUKSO`]: mevBoostLukso.get(),
    [`${prefix}FEE_RECIPIENT_LUKSO`]: feeRecipientLukso.get(),
    [`${prefix}OP_ENABLE_HISTORICAL_RPC`]: opEnableHistoricalRpc.get(),
    [`${prefix}OP_EXECUTION_CLIENT`]: opExecutionClient.get(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

/**
 * Compute global ENVs from DB values and persist it to .env file
 */
export function writeGlobalEnvsToEnvFile(): void {
  writeEnvFile(globalEnvsFilePath, computeGlobalEnvsFromDb(false));
}
