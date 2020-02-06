import { pickBy } from "lodash";
import { parseService } from "../../../utils/dockerComposeParsers";
import { Compose, SpecialPermission } from "../../../types";

/* eslint-disable @typescript-eslint/camelcase */

/**
 * Gets relevant settings in the compose that may be dangerous or grant
 * special permissions to this release's DNP
 */
export function getReleaseSpecialPermissions({
  compose,
  isCore
}: {
  compose: Compose;
  isCore: boolean;
}): SpecialPermission[] {
  const specialPermissions: SpecialPermission[] = [];

  const service = parseService(compose);
  const { network_mode, privileged, cap_add } = service;
  const ipv4Address = Array.isArray(service.networks)
    ? null
    : ((service.networks || {}).network || {}).ipv4_address;
  const externalVols = compose.volumes
    ? Object.keys(pickBy(compose.volumes, vol => vol.external))
    : [];

  for (const externalVol of externalVols) {
    // externalVol = "dncore_ethchaindnpdappnodeeth_data:/app/.ethchain:ro"
    const host = externalVol.split(":")[0];
    const parts = host.split("_");
    if (parts[0] === "dncore")
      specialPermissions.push({
        name: "Access to core volume",
        details: `Allows the DAppNode Package to read and write to the core volume ${host}`
      });
    else
      specialPermissions.push({
        name: "Access to DAppNode Package volume",
        details: `Allows the DAppNode Package to read and write to the volume ${host}`
      });
  }

  if (privileged || (cap_add || []).includes("ALL"))
    specialPermissions.push({
      name: "Privileged access to the system host",
      details:
        "Allows the DAppNode Package to manipulate and read any installed DAppNode Package and install additional packages. Allows the DAppNode Package to fully interact with the host system"
    });

  if (isCore && ipv4Address)
    specialPermissions.push({
      name: "Admin privileges in DAppNode's WAMP",
      details:
        "Allows the DAppNode Package to call any WAMP method of any DAppNode Package restricted to admin users"
    });

  for (const cap of cap_add || []) {
    if (cap !== "ALL")
      specialPermissions.push({
        name: `Privileged system capability ${cap}`,
        details: `See docker docs for more information https://docs.docker.com/engine/reference/run/#runtime-privilege-and-linux-capabilities`
      });
  }

  if (network_mode === "host")
    specialPermissions.push({
      name: "Access to the host network",
      details:
        "Allows the DAppNode Package to connect directly to the host's network. It can bind its open ports directly to the host's IP address"
    });

  return specialPermissions;
}

/* eslint-enable @typescript-eslint/camelcase */
