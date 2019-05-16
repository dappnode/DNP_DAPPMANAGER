const docker = require("./Docker");
const db = require("db");
const { eventBus, eventBusTag } = require("eventBus");
const { stringIncludes } = require("utils/strings");

// Ports error example error
// root@lionDAppnode:/usr/src/dappnode/DNCORE/dc# docker-compose -f docker-compose2.yml up -d
// WARNING: Found orphan containers (dc_dnp1_1) for this project. If you removed or renamed this service in your compose file, you can run this command with the --remove-orphans flag to clean it up.
// Creating dc_dnp2_1 ... error

// ERROR: for dc_dnp2_1  Cannot start service dnp2: driver failed programming external connectivity on endpoint dc_dnp2_1 (cee2e0d559f12a9434100ff9368b4535380b0e2637ab854475a63c032315b22e): Bind for 0.0.0.0:3000 failed: port is already allocated

// ERROR: for dnp2  Cannot start service dnp2: driver failed programming external connectivity on endpoint dc_dnp2_1 (cee2e0d559f12a9434100ff9368b4535380b0e2637ab854475a63c032315b22e): Bind for 0.0.0.0:3000 failed: port is already allocated
// ERROR: Encountered errors while bringing up the project.

async function dockerComposeUpSafe(dockerComposePath, options) {
  try {
    return await docker.compose.up(dockerComposePath, options);
  } catch (e) {
    /**
     * These port two modules use docker. If they are imported above,
     * docker will no be defined yet, then they must be imported dynamically
     * to ensure a proper import order
     */
    const lockPorts = require("modules/lockPorts");
    const unlockPorts = require("modules/unlockPorts");

    if (stringIncludes((e || {}).message, "port is already allocated")) {
      const upnpAvailable = await db.get("upnpAvailable");
      if (upnpAvailable) {
        // Don't try to find which port caused the error.
        // In case of multiple collitions you would need to call this function recursively
        // Just reset all ephemeral ports

        // unlockPorts will modify the docker-compose to remove the port bidnings
        // in order to let docker to assign new ones
        const portsToClose = await unlockPorts(dockerComposePath);
        if (portsToClose.length) {
          const kwargs = { action: "close", ports: portsToClose };
          eventBus.emit(eventBusTag.call, { callId: "managePorts", kwargs });
        }

        // Up the package and lock the ports again
        await docker.compose.up(dockerComposePath);
        const portsToOpen = await lockPorts({ dockerComposePath });
        if (portsToOpen.length) {
          const kwargs = { action: "open", ports: portsToOpen };
          eventBus.emit(eventBusTag.call, { callId: "managePorts", kwargs });
        }
      }
    }
  }
}

module.exports = {
  compose: {
    up: dockerComposeUpSafe
  }
};
