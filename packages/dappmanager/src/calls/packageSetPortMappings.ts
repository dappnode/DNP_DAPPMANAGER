import * as eventBus from "../eventBus";
import params from "../params";
import { listContainer } from "../modules/docker/listContainers";
import { ComposeFileEditor } from "../modules/compose/editor";
import { PortMapping } from "../types";
import { restartPackage } from "../modules/docker/restartPackage";

/**
 * Updates the .env file of a package. If requested, also re-ups it
 *
 * @param {string} id DNP .eth name
 * @param {array} portMappings [
 *   { host: 30444, container: 30303, protocol: "UDP" },
 *   { host: 4000, container: 4000, protocol: "TCP" }
 * ]
 */
export async function packageSetPortMappings({
  id,
  portMappings,
  options
}: {
  id: string;
  portMappings: PortMapping[];
  options?: { merge: boolean };
}): Promise<void> {
  if (!id) throw Error("kwarg id must be defined");
  if (!Array.isArray(portMappings))
    throw Error("kwarg portMappings must be an array");

  const dnp = await listContainer(id);

  if (dnp.name === params.dappmanagerDnpName)
    throw Error("Can not edit DAPPAMANAGER ports");

  const compose = new ComposeFileEditor(dnp.name, dnp.isCore);
  const service = compose.service();
  const previousPortMappings = service.getPortMappings();
  if (options && options.merge) service.mergePortMapping(portMappings);
  else service.setPortMapping(portMappings);
  compose.write();

  try {
    // packageRestart triggers > eventBus emitPackages
    await restartPackage(id);
  } catch (e) {
    if (e.message.toLowerCase().includes("port is already allocated")) {
      // Rollback port mappings are re-up
      service.setPortMapping(previousPortMappings);
      compose.write();

      await restartPackage(id);

      // Try to get the port colliding from the error
      const ipAndPort = (e.message.match(
        /(?:Bind for)(.+)(?:failed: port is already allocated)/
      ) || [])[1];
      const collidingPortNumber = (ipAndPort || "").split(":")[1] || "";

      // Throw error
      throw Error(
        `${
          collidingPortNumber
            ? `Port ${collidingPortNumber} is already mapped`
            : "Port collision"
        }. Reverted port mapping update`
      );
    }
  }

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ ids: [id] });

  // Trigger a natRenewal update to open ports if necessary
  eventBus.runNatRenewal.emit();
}
