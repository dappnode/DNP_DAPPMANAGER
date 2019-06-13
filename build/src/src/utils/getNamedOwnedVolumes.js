const { stringIncludes } = require("utils/strings");

/**
 * Computes the namedOwnedVolumes of a DNP and the also the DNPs
 * that are using each volume.
 *
 * @param {array} dnpList
 * @param {string} id "nginx-proxy.dnp.dappnode.eth"
 * @param {object} options:
 * - aggregate {bool}: return compiled list of dnpsToRemove and volume names
 * @returns {array}
 * result = [
 *   {
 *     name: "nginxproxydnpdappnodeeth_html",
 *     dnpsToRemove: ["letsencrypt-nginx.dnp.dappnode.eth"]
 *   },
 *   {
 *     name: "1f6ceacbdb011451622aa4a5904309765dc2bfb0f4affe163f4e22cba4f7725b",
 *     dnpsToRemove: []
 *   },
 *   {
 *     name: "nginxproxydnpdappnodeeth_vhost.d",
 *     dnpsToRemove: ["letsencrypt-nginx.dnp.dappnode.eth"]
 *   }
 * ]
 *
 * <or>
 *
 * resultWithAggregate = {
 *   names: [
 *     "nginxproxydnpdappnodeeth_html",
 *     "1f6ceacbdb011451622aa4a5904309765dc2bfb0f4affe163f4e22cba4f7725b",
 *     "nginxproxydnpdappnodeeth_vhost.d"
 *   ],
 *   dnpsToRemove: ["letsencrypt-nginx.dnp.dappnode.eth"]
 * }
 */
function getNamedOwnedVolumes(dnpList, id, options = {}) {
  // Parse options
  const { aggregate } = options;

  const formatName = s => s.replace(/[^0-9a-z]/gi, "");
  const dnp = dnpList.find(_dnp => stringIncludes(_dnp.name, id));
  const dnpNameVolFormat = formatName(dnp.name);
  const dnpNamesVolFormat = dnpList
    .map(_dnp => formatName(_dnp.name))
    .filter(_name => _name !== dnpNameVolFormat);

  const namedOwnedVolumes = [];
  for (const vol of dnp.volumes || []) {
    // Ignore non-named volumes
    if (!vol.name) continue;

    if (dnpNamesVolFormat.some(dnpName => stringIncludes(vol.name, dnpName))) {
      // Volume owned by some other package
    } else {
      // Volume owned by this DNP
      // Check who else is using this volume
      namedOwnedVolumes.push({
        name: vol.name,
        dnpsToRemove: dnpList
          .filter(
            _dnp =>
              (_dnp.volumes || []).some(_vol => _vol.name === vol.name) &&
              _dnp.name !== dnp.name
          )
          .map(_dnp => _dnp.name)
      });
    }
  }

  if (aggregate) {
    return {
      names: namedOwnedVolumes.map(vol => vol.name),
      dnpsToRemove: namedOwnedVolumes
        .reduce((dnps, vol) => {
          return [...dnps, ...vol.dnpsToRemove];
        }, [])
        .filter((value, i, self) => self.indexOf(value) === i)
    };
  } else {
    return namedOwnedVolumes;
  }
}

module.exports = getNamedOwnedVolumes;
