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
export const premiumGetLicenseKey = async (): Promise<{ key: string; hash: string }> => {
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
    let message: string;

    switch (response.status) {
      case 403:
        message = "License does not exist";
        break;
      case 429:
        message = "Too many requests. Wait until tomorrow to try again.";
        break;
      default:
        message = "Internal server error";
        break;
    }

    throw new Error(message);
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

/**
 * Activates the beacon node backup
 * @param id the hashed license
 */
export const premiumBeaconBackupActivate = async (id: string): Promise<void> => {
  const response = await fetch(`${baseUrl}:8080/api/keys/activate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ id })
  });

  if (!response.ok) {
    throw new Error(`Failed to activate beacon backup: ${response.statusText}`);
  }
};

/**
 * Deactivates the beacon node backup
 * @param id the hashed license
 */
export const premiumBeaconBackupDeactivate = async (id: string): Promise<void> => {
  const response = await fetch(`${baseUrl}:8080/api/keys/deactivate`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ id })
  });

  if (!response.ok) {
    throw new Error(`Failed to deactivate beacon backup: ${response.statusText}`);
  }
};

/**
 * Checks the activation and validity status of the beacon node backup associated with the given hashed license.
 *
 * - Determines if the backup is activable.
 * - Determines if the backup is currently active.
 * - Returns time remaining until activation becomes possible in seconds (if not activable).
 * - Returns time remaining until deactivation in seconds (if currently active).
 *
 * @param hashedLicense The hashed license string used to identify the key.
 */
export const premiumBeaconBackupStatus = async (
  hashedLicense: string
): Promise<{
  validatorLimit: number;
  isActivable: boolean;
  secondsUntilActivable?: number;
  isActive: boolean;
  secondsUntilDeactivation?: number;
}> => {
  const response = await fetch(`${baseUrl}:8080/api/keys/${hashedLicense}`);

  if (!response.ok) {
    throw new Error(`Failed to check backup node status: ${response.statusText}`);
  }

  const data = await response.json();
  const validatorLimit = data.ValidatorLimit;
  const validUntilString = data.ValidUntil;
  const validUntil = new Date(validUntilString);
  const now = new Date();

  const isZeroTime = validUntilString === "0001-01-01T00:00:00Z";

  // Activation grace period (30 days after ValidUntil)
  const gracePeriodEnd = new Date(validUntil.getTime() + 30 * 24 * 60 * 60 * 1000);
  const hasPassedGracePeriod = now > gracePeriodEnd;

  const isActivable = isZeroTime || hasPassedGracePeriod;
  const isActive = validUntil > now;

  const result: {
    validatorLimit: number;
    isActivable: boolean;
    secondsUntilActivable?: number;
    isActive: boolean;
    secondsUntilDeactivation?: number;
  } = {
    validatorLimit,
    isActivable,
    isActive
  };

  if (!isActivable) {
    result.secondsUntilActivable = Math.floor((gracePeriodEnd.getTime() - now.getTime()) / 1000);
  }

  if (isActive) {
    result.secondsUntilDeactivation = Math.floor((validUntil.getTime() - now.getTime()) / 1000);
  }

  return result;
};
