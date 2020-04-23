import { RequestData } from "../route-types/packageGettingStartedToggle";
import * as db from "../db";
import * as eventBus from "../eventBus";

/**
 * Toggles the visibility of a getting started block
 * @param show Should be shown on hidden
 */
export default async function packageGettingStartedToggle({
  id,
  show
}: RequestData): Promise<void> {
  if (!id) throw Error("kwarg id must be defined");

  db.packageGettingStartedShow.set(id, show);

  // Emit packages update
  eventBus.requestPackages.emit();
}
