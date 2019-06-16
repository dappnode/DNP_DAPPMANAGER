const checkDnpBlacklist = require("../lowLevelCommands/checkDnpBlacklist");
const composeRm = require("../lowLevelCommands/composeRm");
const composeUp = require("../lowLevelCommands/composeUp");
const getComposeInstance = require("../lowLevelCommands/getComposeInstance");
const volumeRm = require("../lowLevelCommands/volumeRm");
const getDnpExtendedData = require("./getDnpExtendedData");
const { uniqueValues } = require("utils/arrays");

async function removeDnpVolumes(id, { restartDnpsAfter = true }) {
  const dnp = await getDnpExtendedData(id);
  /**
   * @param {object} namedOwnedVolumes = {
   *   names: ["nginxproxydnpdappnodeeth_html", "nginxproxydnpdappnodeeth_vhost.d"],
   *   dnpsToRemove: ["letsencrypt-nginx.dnp.dappnode.eth", "nginx-proxy.dnp.dappnode.eth"]
   * }
   */
  // If there are no volumes don't do anything
  if (!dnp.volumes) return;
  const namedOwnedVolumes = dnp.volumes.filter(vol => vol.name && vol.isOwner);
  if (!namedOwnedVolumes.length) return;

  // Destructure result and append the current requested DNP (id)
  const volumeNames = namedOwnedVolumes.map(vol => vol.name);
  const dnpsToRemove = namedOwnedVolumes.reduce(
    (dnps, vol) => uniqueValues([...dnps, ...vol.users]),
    []
  );

  // Make sure you are not calling down on blacklisted DNPs (e.j. dappmanager)
  for (const dnpName of dnpsToRemove) {
    checkDnpBlacklist("down", dnpName);
    // Used to verify that the docker-compose.yml exists, will throw otherwise
    getComposeInstance(dnpName);
  }

  let err;
  try {
    for (const dnpName of dnpsToRemove) await composeRm(dnpName);
    for (const volumeName of volumeNames) await volumeRm(volumeName);
  } catch (e) {
    err = e;
  }
  // Restart DNPs if restartDnpsAfter = true
  if (restartDnpsAfter || err)
    for (const dnpName of dnpsToRemove) await composeUp(dnpName);
  // In case of error: FIRST up the dnp, THEN throw the error
  if (err) throw err;

  return volumeNames;
}

module.exports = removeDnpVolumes;
