import { parsePortMappings } from "./dockerComposeParsers";
import { PortMapping, ManifestInterface } from "../types";

export default function appendIsPortDeletable(
  portMappings: PortMapping[],
  manifest: ManifestInterface
) {
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
