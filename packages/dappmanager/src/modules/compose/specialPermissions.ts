import { Compose, SpecialPermission } from "../../types";

/**
 * Parses relevant settings in the compose that may be dangerous or grant
 * special permissions to this release's DNP
 */
export function parseSpecialPermissions(
  compose: Compose,
  isCore: boolean
): SpecialPermission[] {
  const specialPermissions: SpecialPermission[] = [];

  for (const [serviceName, service] of Object.entries(compose.services)) {
    const { network_mode, privileged, cap_add } = service;

    if (compose.volumes)
      for (const volId in compose.volumes) {
        const vol = compose.volumes[volId];
        if (vol.external) {
          // volName = "gethdnpdappnodeeth_data"
          const volName =
            (typeof vol.external === "object" && vol.external.name) || volId;
          const parts = volName.split("_");
          if (parts[0] === "dncore")
            specialPermissions.push({
              name: "Access to core volume",
              details: `Allows to read and write to the core volume ${volName}`,
              serviceName
            });
          else
            specialPermissions.push({
              name: "Access to package volume",
              details: `Allows to read and write to the volume ${volName}`,
              serviceName
            });
        }
      }

    if (privileged || (cap_add || []).includes("ALL"))
      specialPermissions.push({
        name: "Privileged access to the system host",
        details:
          "Allows to manipulate and read any installed package and install additional packages. Allows to fully interact with the host system",
        serviceName
      });

    if (isCore && service.networks && !Array.isArray(service.networks)) {
      const { ipv4_address } = (service.networks || {}).network || {};
      if (ipv4_address)
        specialPermissions.push({
          name: "Admin privileges in DAppNode's API",
          details: "Allows package can execute all admin action",
          serviceName
        });
    }

    for (const cap of cap_add || [])
      if (cap !== "ALL")
        specialPermissions.push({
          name: `Privileged system capability ${cap}`,
          details: `See docker docs for more information https://docs.docker.com/engine/reference/run/#runtime-privilege-and-linux-capabilities`,
          serviceName
        });

    if (network_mode === "host")
      specialPermissions.push({
        name: "Access to the host network",
        details:
          "Allows to connect directly to the host's network. It can bind its open ports directly to the host's IP address",
        serviceName
      });
  }

  return specialPermissions;
}
