import { listPackageNoThrow } from "@dappnode/dockerapi";
import { params } from "@dappnode/params";

const baseUrl = "http://premium.dappnode";

/**
 * Returns the Premium package status
 */
export const premiumPkgStatus = async (): Promise<{
  premiumDnpInstalled: boolean;
  premiumDnpRunning: boolean;
}> => {
  const premiumDnp = await listPackageNoThrow({ dnpName: params.PREMIUM_DNP_NAME });
  const premiumDnpInstalled = Boolean(premiumDnp);
  const premiumDnpRunning = premiumDnp && premiumDnp.containers.every((c) => c.state === "running");

  return {
    premiumDnpInstalled,
    premiumDnpRunning: Boolean(premiumDnpRunning)
  };
};

/**
 * Sets current license key
 * @param licenseKey License key to set
 */
export const premiumSetLicenseKey = async (licenseKey: string): Promise<void> => {
  const response = await fetch(`${baseUrl}:8080/api/license`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ key: licenseKey })
  });

  if (!response.ok) {
    throw new Error(`Failed to activate premium: ${response.statusText}`);
  }
};

/**
 * Returns your current license key and hash
 */
export const premiumGetLicenseKey = async (): Promise<{ key: string, hash:string }> => {
  const response = await fetch(`${baseUrl}:8080/api/license`);

  if (!response.ok) {
    throw new Error(`Failed to get premium license key: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Activates premium license key
 */
export const premiumActivateLicense = async (): Promise<void> => {
  const response = await fetch(`${baseUrl}:8080/api/license/activate`, {
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(`Failed to activate premium: ${response.statusText}`);
  }
};

/**
 * Deactivates premium license key
 */
export const premiumDeactivateLicense = async (): Promise<void> => {
  const response = await fetch(`${baseUrl}:8080/api/license/deactivate`, {
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(`Failed to deactivate premium: ${response.statusText}`);
  }
};

/**
 * Checks if the premium license is active
 */
export const premiumIsLicenseActive = async (): Promise<boolean> => {
  const response = await fetch(`${baseUrl}:8080/api/license/validate`);

  if (!response.ok) {
    throw new Error(`Failed to check premium status: ${response.statusText}`);
  }

  const data = await response.json();
  return data.valid;
};
