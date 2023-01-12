import { SpecialPermission } from "@dappnode/common";
import { Compose } from "@dappnode/dappnodesdk";

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
