import * as db from "../db/index.js";
import { eventBus } from "../eventBus.js";

/**
 * Toggles the visibility of a getting started block
 * @param show Should be shown on hidden
 */
export async function packageGettingStartedToggle({
  dnpName,
  show
}: {
  dnpName: string;
  show: boolean;
}): Promise<void> {
  if (!dnpName) throw Error("kwarg dnpName must be defined");

  db.packageGettingStartedShow.set(dnpName, show);

  // Emit packages update
  eventBus.requestPackages.emit();
}
