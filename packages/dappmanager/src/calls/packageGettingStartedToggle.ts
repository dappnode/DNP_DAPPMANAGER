import * as db from "../db";
import * as eventBus from "../eventBus";

/**
 * Toggles the visibility of a getting started block
 * @param show Should be shown on hidden
 */
export async function packageGettingStartedToggle({
  id,
  show
}: {
  id: string;
  show: boolean;
}): Promise<void> {
  if (!id) throw Error("kwarg id must be defined");

  db.packageGettingStartedShow.set(id, show);

  // Emit packages update
  eventBus.requestPackages.emit();
}
