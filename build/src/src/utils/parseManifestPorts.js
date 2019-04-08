/**
 * Parses ports
 * @param {Object} manifest or portsArray = ['32323:30303/udp']
 * @return {Array} [ {number: '32323', type: 'UDP'}, ... ]
 */
function parseManifestPorts(manifest = {}) {
  if (!manifest) return [];
  const portsArray = (manifest.image || {}).ports || [];

  //                host : container / type
  // portsArray = ['32323:30303/udp']
  //               container / type
  // portsArray = ['30303/udp']
  return (
    portsArray
      // Ensure each port mapping is unique
      .filter((item, i, ar) => ar.indexOf(item) === i)
      // Ignore ports that are not mapped
      .filter(e => e.includes(":"))
      // Transform ['30303:30303/udp'] => [ {number: '30303', type: 'UDP'} ]
      .map(p => {
        const hostPortNumber = p.split(":")[0];
        const portType = p.split("/")[1] || "TCP";
        return {
          number: hostPortNumber,
          type: (portType || "").toUpperCase()
        };
      })
  );
}

module.exports = parseManifestPorts;
