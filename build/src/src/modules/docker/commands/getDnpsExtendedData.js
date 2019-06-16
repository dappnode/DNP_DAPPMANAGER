const listContainers = require("../lowLevelCommands/listContainers");
const parseContainer = require("../parsers/parseContainer");
const { stringIncludes } = require("utils/strings");

async function getDnpsExtendedData() {
  const containers = await listContainers();
  const dnps = containers
    .map(parseContainer)
    .filter(dnp => dnp.isDnp || dnp.isCore);

  /**
   * [EXTENDS]
   * Do data manipulation that requires info from other DNPs
   */

  /**
   * Compile volume users
   * @param {object} namedVolumesUsers = {
   *   "nginxproxydnpdappnodeeth_html": [
   *     "letsencrypt-nginx.dnp.dappnode.eth",
   *     "nginx-proxy.dnp.dappnode.eth"
   *   ]
   * }
   * @param {object} namedVolumesOwners = {
   *   "nginxproxydnpdappnodeeth_html": "nginx-proxy.dnp.dappnode.eth"
   * }
   */
  const namedVolumesUsers = {};
  for (const dnp of dnps) {
    for (const vol of dnp.volumes || []) {
      if (!vol.name) continue;
      if (!namedVolumesUsers[vol.name])
        namedVolumesUsers[vol.name] = [dnp.name];
      else if (!namedVolumesUsers[vol.name].includes(dnp.name))
        namedVolumesUsers[vol.name].push(dnp.name);
    }
  }
  const namedVolumesOwners = {};
  for (const [volName, users] of Object.entries(namedVolumesUsers)) {
    for (const dnpName of users) {
      // "nginx-proxy.dnp.dappnode.eth" => "nginxproxydnpdappnodeeth"
      if (stringIncludes(volName, dnpName.replace(/[^0-9a-z]/gi, "")))
        namedVolumesOwners[volName] = dnpName;
    }
    // Fallback, assign ownership to the first user
    if (!namedVolumesOwners[volName]) namedVolumesOwners[volName] = users[0];
  }

  const dnpListExtended = dnps.map(dnp => {
    if (!dnp.volumes) return dnp;
    const volumes = dnp.volumes.map(vol => {
      if (!vol.name) return vol;
      return {
        ...vol,
        users: namedVolumesUsers[vol.name],
        owner: namedVolumesOwners[vol.name],
        isOwner: namedVolumesOwners[vol.name] === dnp.name
      };
    });
    return { ...dnp, volumes };
  });

  return dnpListExtended;
}

module.exports = getDnpsExtendedData;
