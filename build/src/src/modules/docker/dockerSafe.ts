import { dockerComposeUp } from "./dockerCommands";
import { readComposeObj } from "../../utils/dockerComposeFile";
import * as db from "../../db";
import * as eventBus from "../../eventBus";
import lockPorts from "../lockPorts";
import unlockPorts from "../unlockPorts";

// Ports error example error
// root@lionDAppnode:/usr/src/dappnode/DNCORE/dc# docker-compose -f docker-compose2.yml up -d
// WARNING: Found orphan containers (dc_dnp1_1) for this project. If you removed or renamed this service in your compose file, you can run this command with the --remove-orphans flag to clean it up.
// Creating dc_dnp2_1 ... error

// ERROR: for dc_dnp2_1  Cannot start service dnp2: driver failed programming external connectivity on endpoint dc_dnp2_1 (cee2e0d559f12a9434100ff9368b4535380b0e2637ab854475a63c032315b22e): Bind for 0.0.0.0:3000 failed: port is already allocated

// ERROR: for dnp2  Cannot start service dnp2: driver failed programming external connectivity on endpoint dc_dnp2_1 (cee2e0d559f12a9434100ff9368b4535380b0e2637ab854475a63c032315b22e): Bind for 0.0.0.0:3000 failed: port is already allocated
// ERROR: Encountered errors while bringing up the project.

export async function dockerComposeUpSafe(
  dockerComposePath: string
): Promise<void> {
  try {
    await dockerComposeUp(dockerComposePath);
  } catch (e) {
    /**
     * These port two modules use docker. If they are imported above,
     * docker will no be defined yet, then they must be imported dynamically
     * to ensure a proper import order
     */

    if (
      e.message.includes("port is already allocated") &&
      db.getUpnpAvailable()
    ) {
      // Don't try to find which port caused the error.
      // In case of multiple collitions you would need to call this function recursively
      // Just reset all ephemeral ports

      // unlockPorts will modify the docker-compose to remove the port bidnings
      // in order to let docker to assign new ones
      // The natRenewal loop will close them by not renewing the mapping
      await unlockPorts(dockerComposePath);

      // #### PATCH to get id from dockerComposePath
      const dc = readComposeObj(dockerComposePath);
      const id = Object.keys(dc.services)[0];

      // Up the package and lock the ports again
      await dockerComposeUp(dockerComposePath);
      const newPortMappings = await lockPorts(id);
      if (newPortMappings && newPortMappings.length) {
        // Trigger a natRenewal update to open ports if necessary
        eventBus.runNatRenewal.emit();
      }
    } else {
      throw e;
    }
  }
}
