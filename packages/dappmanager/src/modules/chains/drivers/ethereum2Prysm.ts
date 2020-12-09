import fetch from "node-fetch";
import memoize from "memoizee";
import { urlJoin } from "../../../utils/url";
import { ChainDataResult } from "../types";
import { safeProgress } from "../utils";
import { InstalledPackageData } from "../../../common";
import { getDotDappnodeDomain } from "../../../watchers/nsupdate/utils";

const MIN_SLOT_DIFF_SYNC = 60;

// Wait for Promises to resolve. Do not cache rejections
// Cache for 1 hour, genesis and config should never change
const fetchGenesisMemo = memoize(fetchGenesis, { promise: true, maxAge: 3e6 });
const fetchConfigMemo = memoize(fetchConfig, { promise: true, maxAge: 3e6 });

/**
 * Returns a chain data object for an Ethereum 2.0 Prysm beacon chain node
 * @param apiUrl = "http://beacon-chain.prysm-pyrmont.dappnode:3500/"
 */
export async function ethereum2Prysm(
  dnp: InstalledPackageData
): Promise<ChainDataResult> {
  const packageDomain = getDotDappnodeDomain(dnp.dnpName);
  // http://beacon-chain.prysm-pyrmont.dappnode:3500/
  const apiUrl = `http://beacon-chain.${packageDomain}:3500`;

  const [genesis, config, chainhead] = await Promise.all([
    fetchGenesisMemo(apiUrl),
    fetchConfigMemo(apiUrl),
    fetchChainhead(apiUrl)
  ]);

  return parseEthereum2PrysmState(genesis, config, chainhead);
}

/**
 * Compute the current clock slot from the genesis time itself.
 * Then, you can use localhost:3500/eth/v1alpha1/beacon/chainhead
 * and use headSlot. Then you can produce
 *
 * X slots synced / Y slot total =
 * currentHeadSlot / computeSlot(Date.now - genesisTime)
 */
export function parseEthereum2PrysmState(
  genesis: PrysmGenesis,
  config: PrysmConfig,
  chainhead: PrysmChainhead,
  currentTimeMs = Date.now() // For deterministic testing
): ChainDataResult {
  const genesisTime = genesis.genesisTime;
  const headSlot = parseInt(chainhead.headSlot);
  const secondsPerSlot = parseInt(config.config?.SecondsPerSlot);

  if (!genesisTime) throw Error(`Invalid genesisTime ${genesisTime}`);
  if (isNaN(headSlot)) throw Error(`Invalid headSlot ${chainhead.headSlot}`);
  if (isNaN(secondsPerSlot))
    throw Error(`Invalid secondsPerSlot ${config.config?.SecondsPerSlot}`);

  const genesisDate = new Date(genesis.genesisTime);
  const secondsSinceGenesis = (currentTimeMs - genesisDate.getTime()) / 1000;
  const clockSlot = Math.floor(secondsSinceGenesis / secondsPerSlot);

  if (clockSlot - headSlot < MIN_SLOT_DIFF_SYNC) {
    return {
      syncing: false,
      error: false,
      message: `Synced #${headSlot}`
    };
  } else {
    return {
      syncing: true,
      error: false,
      message: `Slots synced: ${headSlot} / ${clockSlot}`,
      progress: safeProgress(headSlot / clockSlot)
    };
  }
}

/**
 * ```js
 * {
 *   genesisTime: "2020-11-18T12:00:07Z",
 *   depositContractAddress: "jF/s3EcuJ7xEdpb0MeQl0C3Uaow=",
 *   genesisValidatorsRoot: "lDbopjDjFit+1PRJsSuKWjaKS5W8RrlBrmXBFhO/pME="
 * }
 * ```
 */
interface PrysmGenesis {
  genesisTime: string;
}

/**
 * {
 *   headSlot: "151661",
 *   headEpoch: "4739",
 *   headBlockRoot: "sih0FYM2WnXuuwFGVplVSsE6Fg5R/kQDrkMM6YYDMLI=",
 *   finalizedSlot: "151584",
 *   finalizedEpoch: "4737",
 *   finalizedBlockRoot: "In+1hmTBJ7ho68ZLzjQYgtQFyoQKdnp8lGE68elNnSA=",
 *   justifiedSlot: "151616",
 *   justifiedEpoch: "4738",
 *   justifiedBlockRoot: "79kEGiuCbwamiNqe0FB89U2KTyceho2FcYN5MD5We8s=",
 *   previousJustifiedSlot: "151584",
 *   previousJustifiedEpoch: "4737",
 *   previousJustifiedBlockRoot: "In+1hmTBJ7ho68ZLzjQYgtQFyoQKdnp8lGE68elNnSA="
 * }
 */
interface PrysmChainhead {
  headSlot: string;
}

/**
 * {
 *   SecondsPerSlot: "12",
 *   ...
 * }
 */
interface PrysmConfig {
  config: {
    SecondsPerSlot: string;
  };
}

async function fetchGenesis(baseUrl: string): Promise<PrysmGenesis> {
  return await fetchPrysmApi(baseUrl, "/eth/v1alpha1/node/genesis");
}

async function fetchChainhead(baseUrl: string): Promise<PrysmChainhead> {
  return await fetchPrysmApi(baseUrl, "/eth/v1alpha1/beacon/chainhead");
}

async function fetchConfig(baseUrl: string): Promise<PrysmConfig> {
  return await fetchPrysmApi(baseUrl, "/eth/v1alpha1/beacon/config");
}

async function fetchPrysmApi<T>(baseUrl: string, apiPath: string): Promise<T> {
  return await fetch(urlJoin(baseUrl, apiPath)).then(res => res.json());
}
