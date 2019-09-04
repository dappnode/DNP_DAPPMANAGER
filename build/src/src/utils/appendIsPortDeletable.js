const { parsePortMappings } = require("utils/dockerComposeParsers");

function appendIsPortDeletable(portMappings, manifest) {
  const parsedManifestPorts = parsePortMappings(manifest.image.ports || []);

  return portMappings.map(port => ({
    ...port,
    deletable: !parsedManifestPorts.find(
      manifestPort =>
        manifestPort.container == port.container &&
        manifestPort.protocol == port.protocol
    )
  }));
}

module.exports = appendIsPortDeletable;
