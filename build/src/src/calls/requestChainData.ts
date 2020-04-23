import params from "../params";
import * as eventBus from "../eventBus";

/**
 * Requests chain data. Also instructs the DAPPMANAGER
 * to keep sending data for a period of time (5 minutes)
 */
export default async function requestChainData(): Promise<void> {
  params.CHAIN_DATA_UNTIL = Date.now() + 5 * 60 * 1000;

  // Trigger a chainData fetch immediately so
  // it is shown as quick as possible in the front-end
  eventBus.requestChainData.emit();
}
