/**
 * Parses ports
 * @param {object} manifest or portsArray = ['32323:30303/udp']
 * @returns {array} [ {portNumber: '32323', protocol: 'UDP'}, ... ]
 */
function parseManifestPorts(manifest = {}) {
  if (!manifest) return [];
  const portsArray = (manifest.image || {}).ports || [];

  //                host : container / protocol
  // portsArray = ['32323:30303/udp']
  //               container / protocol
  // portsArray = ['30303/udp']
  return (
    portsArray
      // Ensure each port mapping is unique
      .filter((item, i, ar) => ar.indexOf(item) === i)
      // Ignore ports that are not mapped
      .filter(e => e.includes(":"))
      // Transform ['30303:30303/udp'] => [ {portNumber: '30303', protocol: 'UDP'} ]
      .map(p => {
        const hostPortNumber = p.split(":")[0];
        const portType = p.split("/")[1] || "TCP";
        return {
          portNumber: hostPortNumber,
          protocol: (portType || "").toUpperCase()
        };
      })
  );
}

module.exports = parseManifestPorts;
