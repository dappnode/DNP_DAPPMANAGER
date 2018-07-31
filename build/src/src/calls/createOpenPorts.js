const dockerDefault = require('modules/docker');
const logUI = require('utils/logUI');

// CALL DOCUMENTATION:
// > kwargs: { ports, logId }
// > result: -

function createOpenPorts({
    docker = dockerDefault,
}) {
  const openPorts = async ({
      ports,
      logId,
  }) => {
    // ports should be an array of numerical ports
    // [5000, 5001]
    if (!Array.isArray(ports)) {
        throw Error('ports variable must be an array: '+JSON.stringify(ports));
    }

    for (const port of ports) {
        logUI({logId, msg: 'opening port '+port});
        try {
            await docker.openPort(port);
        } catch (e) {
            throw Error('Error openning port '+port+' '
                +(e ? e.message : ''));
        }
    }

    return {
      message: 'Opened ports '+ports.join(', '),
      logMessage: true,
    };
  };

  // Expose main method
  return openPorts;
}

// function getPorts(MANIFEST) {
//     return (MANIFEST && MANIFEST.image && MANIFEST.image.ports)
//     ? MANIFEST.image.ports.map((p) => p.split(':')[0])
//     : [];
//   }


module.exports = createOpenPorts;
