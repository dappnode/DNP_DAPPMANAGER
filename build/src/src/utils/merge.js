
/**
 * The general specification is to provide an object in the form of:
 * {
 *   "old_value": "new_value"
 * }
 */

/**
 *
 * @param {Object} manifest = {
 *   name: "kovan.dnp.dappnode.eth",
 *   image: {
 *     volumes: [
 *       "kovan:/root/.local"
 *     ],
 *     ...
 *   }
 *   ...
 * }
 * @param {Object} userSetVols = {
 *   "kovan.dnp.dappnode.eth": {
 *     "old_path:/root/.local": "new_path:/root/.local"
 *   },
 *   'dependency.dnp.dappnode.eth': {
 *     "/dev:/root/.data": "/hd/dev:/root/.data"
 *   }
 * }
 * @return {Object} edited or original manifest
 */
function mergeManifestVols(manifest, userSetVols) {
    const name = (manifest || {}).name;
    const manifestVols = ((manifest || {}).image || {}).volumes; // is an array
    // No volumes for this specific manifest
    if (!userSetVols[name] || !Object.keys(userSetVols[name]).length) return manifest;
    if (!manifestVols || !manifestVols.length) return manifest;

    // For every volume in the manifest:
    // check if the user has set a new value, otherwise return old value
    const volumes = manifestVols.map((vol) => {
        return userSetVols[name][vol] || vol;
    });
    return {
        ...manifest,
        image: {
            ...manifest.image,
            volumes,
        },
    };
}

/**
 *
 * @param {Object} manifest = {
 *   name: "kovan.dnp.dappnode.eth",
 *   image: {
 *     ports: [
 *       "30303",
 *       "30303/udp",
 *       "30304"
 *     ],
 *     ...
 *   }
 *   ...
 * }
 * @param {Object} userSetPorts = {
 *   "kovan.dnp.dappnode.eth": {
 *     "30303": "31313:30303",
 *     "30303/udp": "31313:30303/udp"
 *   },
 *   'dependency.dnp.dappnode.eth': {
 *     "5001:5001": "5001"
 *   }
 * }
 * @return {Object} edited or original manifest
 */
function mergeManifestPorts(manifest, userSetPorts) {
    const name = (manifest || {}).name;
    const manifestPorts = ((manifest || {}).image || {}).ports; // is an array
    // No ports for this specific manifest
    if (!userSetPorts[name] || !Object.keys(userSetPorts[name]).length) return manifest;
    if (!manifestPorts || !manifestPorts.length) return manifest;

    // For every port in the manifest:
    // check if the user has set a new value, otherwise return old value
    const ports = manifestPorts.map((port) => {
        return userSetPorts[name][port] || port;
    });
    return {
        ...manifest,
        image: {
            ...manifest.image,
            ports,
        },
    };
}

module.exports = {
    manifest: {
        vols: mergeManifestVols,
        ports: mergeManifestPorts,
    },
};
