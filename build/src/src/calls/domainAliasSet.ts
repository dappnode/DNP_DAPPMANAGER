import { RequestData } from "../route-types/domainAliasSet";
import * as db from "../db";
import * as eventBus from "../eventBus";

/**
 * Set a domain alias to a DAppNode package by name
 */
export default async function domainAliasSet({
  alias,
  dnpName
}: RequestData): Promise<void> {
  switch (alias) {
    case "fullnode":
      db.fullnodeDomainTarget.set(dnpName);
      break;
    default:
      throw Error(`Unknown alias: ${alias}`);
  }

  // Trigger an nsupdate run
  eventBus.packagesModified.emit({ ids: [dnpName] });
}
