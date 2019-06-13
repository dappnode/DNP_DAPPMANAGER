const fs = require("fs");
const logs = require("logs.js")(module);
const params = require("params");
const docker = require("modules/docker");
const dockerList = require("modules/dockerList");
const { eventBus, eventBusTag } = require("eventBus");
// Utils
const getPath = require("utils/getPath");
const { stringIncludes } = require("utils/strings");
const { uniqueValues } = require("utils/arrays");

/**
 * Removes a package volumes. The re-ups the package
 *
 * @param {string} id DNP .eth name
 */
async function restartPackageVolumes({ id, doNotRestart }) {
  if (!id) throw Error("kwarg id must be defined");

  const dnpList = await dockerList.listContainers();
  const dnp = dnpList.find(_dnp => stringIncludes(_dnp.name, id));
  if (!dnp) {
    throw Error(`Could not find an container with the name: ${id}`);
  }

  /**
   * @param {object} namedOwnedVolumes = {
   *   names: [
   *     "nginxproxydnpdappnodeeth_html",
   *     "1f6ceacbdb011451622aa4a5904309765dc2bfb0f4affe163f4e22cba4f7725b",
   *     "nginxproxydnpdappnodeeth_vhost.d"
   *   ],
   *   dnpsToRemove: [
   *     "letsencrypt-nginx.dnp.dappnode.eth",
   *     "nginx-proxy.dnp.dappnode.eth"
   *   ]
   * }
   */
  const namedOwnedVolumes = (dnp.volumes || []).filter(
    vol => vol.name && vol.isOwner
  );
  // If there are no volumes don't do anything
  if (!namedOwnedVolumes.length)
    return { message: `${id} has no named volumes` };

  // Destructure result and append the current requested DNP (id)
  const volumeNames = namedOwnedVolumes.map(vol => vol.name);
  const dnpsToRemove = namedOwnedVolumes.reduce((dnps, vol) => {
    return uniqueValues([...dnps, ...vol.users]);
  }, []);

  // Verify results
  const dockerComposePaths = {};

  /**
   * Load docker-compose paths and verify results
   * - All docker-compose must exist
   * - No DNP can be the "dappmanager.dnp.dappnode.eth"
   */
  for (const dnpName of dnpsToRemove) {
    if (dnpName.includes("dappmanager.dnp.dappnode.eth")) {
      throw Error("The dappmanager cannot be restarted");
    }
    const dockerComposePath = getPath.dockerComposeSmart(dnpName, params);
    if (!fs.existsSync(dockerComposePath)) {
      throw Error(`No docker-compose found: ${dockerComposePath}`);
    }
    dockerComposePaths[dnpName] = dockerComposePath;
  }

  let err;
  try {
    for (const dnpName of dnpsToRemove) {
      await docker.compose.rm(dockerComposePaths[dnpName]);
    }
    await docker.volume.rm(volumeNames.join(" "));
  } catch (e) {
    err = e;
  }
  // Restart docker to apply changes
  // Offer a doNotRestart option for the removePackage call
  if (doNotRestart) {
    logs.warn(`On restartPackageVolumes, doNotRestart = true`);
  } else {
    for (const dnpName of dnpsToRemove) {
      await docker.safe.compose.up(dockerComposePaths[dnpName]);
    }
  }

  // In case of error: FIRST up the dnp, THEN throw the error
  if (err) throw err;

  // Emit packages update
  eventBus.emit(eventBusTag.emitPackages);

  return {
    message: `Restarted ${id} volumes: ${volumeNames.join(" ")}`,
    logMessage: true,
    userAction: true
  };
}

module.exports = restartPackageVolumes;
