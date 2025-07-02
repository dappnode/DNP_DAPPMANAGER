import { httpsPortal } from "@dappnode/httpsportal";
import { domain } from "@dappnode/db";
import { listPackageNoThrow } from "@dappnode/dockerapi";
import { params } from "@dappnode/params";

/**
 * Returns the HTTPS package status and PWA mapping url if it exists, otherwise adds the mapping.
 */
export async function pwaRequirementsGet(): Promise<{
  httpsDnpInstalled: boolean;
  isHttpsRunning: boolean;
  pwaMappingUrl: string | undefined;
}> {
  const httpsDnp = await listPackageNoThrow({ dnpName: params.HTTPS_PORTAL_DNPNAME });
  const httpsDnpInstalled = Boolean(httpsDnp);
  const isHttpsRunning = httpsDnp && httpsDnp.containers.every((c) => c.state === "running");

  await httpsPortal.addPwaMappingIfNotExists();
  const pwaMappingUrl = await pwaUrlGet();
  return {
    pwaMappingUrl,
    httpsDnpInstalled,
    isHttpsRunning: Boolean(isHttpsRunning)
  };
}

/**
 * Returns the PWA mapping URL if it exists, otherwise returns undefined.
 */
export async function pwaUrlGet(): Promise<string | undefined> {
  const mappings = await httpsPortal.getMappings();
  const pwaMapping = mappings.find((mapping) => mapping.fromSubdomain === "pwa");
  const dyndnsDomain = domain.get();

  return pwaMapping ? `https://pwa.${dyndnsDomain}` : undefined;
}
