import { removeNamedVolume } from "../modules/docker/removeNamedVolume.js";
import { eventBus } from "@dappnode/eventbus";

/**
 * Removes a docker volume by name
 *
 * @param name Full volume name: "bitcoindnpdappnodeeth_bitcoin_data"
 */
export async function volumeRemove({ name }: { name: string }): Promise<void> {
  if (!name) throw Error("kwarg name must be defined");

  await removeNamedVolume(name);

  // Emit packages update
  eventBus.requestPackages.emit();
}
