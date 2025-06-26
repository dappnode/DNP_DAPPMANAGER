import { httpsPortal } from "@dappnode/httpsportal";
import { domain } from "@dappnode/db";
import { listPackageNoThrow } from "@dappnode/dockerapi";
import { params } from "@dappnode/params";

/**
 * Returns the HTTPS package status and PWA mapping url if it exists, otherwise adds the mapping.
 */
export async function getPwaRequirements(): Promise<{
  httpsDnpInstalled: boolean;
  isHttpsRunning: boolean;
  pwaMappingUrl: string | undefined;
}> {
  const httpsDnp = await listPackageNoThrow({ dnpName: params.HTTPS_PORTAL_DNPNAME });
  const httpsDnpInstalled = Boolean(httpsDnp);
  const isHttpsRunning = httpsDnp && httpsDnp.containers.every((c) => c.state === "running");

  await httpsPortal.addPwaMappingIfNotExists();
  const mappings = await httpsPortal.getMappings();

  const pwaMapping = mappings.find((mapping) => mapping.fromSubdomain === "pwa");
  const dyndnsDomain = domain.get();
  return {
    pwaMappingUrl: pwaMapping && `https://pwa.${dyndnsDomain}`,
    httpsDnpInstalled,
    isHttpsRunning: Boolean(isHttpsRunning)
  };
}
