const dockerDefault = require('modules/docker');

// CALL DOCUMENTATION:
// > kwargs: { ports, logId }
// > result: -

function createManagePorts({
    docker = dockerDefault,
}) {
  const managePorts = async ({
      action,
      ports,
  }) => {
    // ports should be an array of numerical ports
    // [5000, 5001]
    if (!Array.isArray(ports)) {
        throw Error('ports variable must be an array: '+JSON.stringify(ports));
    }

    let msg;
    for (const port of ports) {
        switch (action) {
            case 'open':
                await docker.openPort(port);
                msg = 'Opened';
                break;
            case 'close':
                await docker.closePort(port);
                msg = 'Closed';
                break;
            default:
                throw Error('Unkown manage ports action: '+action);
        }
    }

    return {
      message: msg+' ports '+ports.join(', '),
      logMessage: true,
    };
  };

  // Expose main method
  return managePorts;
}

// function getPorts(MANIFEST) {
//     return (MANIFEST && MANIFEST.image && MANIFEST.image.ports)
//     ? MANIFEST.image.ports.map((p) => p.split(':')[0])
//     : [];
//   }


module.exports = createManagePorts;
