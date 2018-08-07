const fs = require('fs');
const getPath = require('utils/getPath');
const shell = require('utils/shell');
const logUI = require('utils/logUI');
const paramsDefault = require('params');
const dockerDefault = require('modules/docker');

// CALL DOCUMENTATION:
// > kwargs: {
//     id,
//     deleteVolumes,
//     logId
//   }
// > result: empty = {}

function createRemovePackage({
  params = paramsDefault,
  docker = dockerDefault,
}) {
  const removePackage = async ({
    id,
    deleteVolumes = false,
    logId,
  }) => {
    const packageRepoDir = getPath.packageRepoDir(id, params);

    const dockerComposePath = getPath.dockerComposeSmart(id, params);
    if (!fs.existsSync(dockerComposePath)) {
      throw Error('No docker-compose found: ' + dockerComposePath);
    }

    if (id.includes('dappmanager.dnp.dappnode.eth')) {
      throw Error('The installer cannot be restarted');
    }

    // Remove container (and) volumes
    logUI({logId, pkg: 'all', msg: 'Shutting down containers...'});
    await docker.compose.down(dockerComposePath, {volumes: Boolean(deleteVolumes)});
    // Remove DNP folder and files
    logUI({logId, pkg: 'all', msg: 'Removing system files...'});
    await shell('rm -r ' + packageRepoDir);

    return {
      message: 'Removed package: ' + id,
      logMessage: true,
      userAction: true,
    };
  };

  // Expose main method
  return removePackage;
}


module.exports = createRemovePackage;
