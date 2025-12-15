import { listPackageNoThrow } from "@dappnode/dockerapi";
import { params } from "@dappnode/params";
import { BeaconBackupNetworkStatus, Network } from "@dappnode/types";

const baseUrl = "http://premium.dappnode";
const baseUrlTest = "https://0fb336699cb1.ngrok-free.app";

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
 * @param key the hashed license
 * @param network the network that the backup will be activated on
 */
export const premiumBeaconBackupActivate = async ({
  key,
  network
}: {
  key: string;
  network: Network;
}): Promise<void> => {
  const response = await fetch(`${baseUrlTest}/keys/activate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ key, network })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to activate beacon backup: ${error}`);
  }
};

/**
 * Deactivates the beacon node backup
 * @param key the hashed license
 * @param network the network that the backup will be deactivated on
 */
export const premiumBeaconBackupDeactivate = async ({
  key,
  network
}: {
  key: string;
  network: Network;
}): Promise<void> => {
  const response = await fetch(`${baseUrlTest}/keys/deactivate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ key, network })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to deactivate beacon backup: ${error}`);
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
): Promise<Record<Network, BeaconBackupNetworkStatus>> => {
  console.log("Fetching beacon backup status for hashedLicense:", `${baseUrlTest}/keys/details?id=${hashedLicense}`);
  const response = await fetch(`${baseUrlTest}/keys/details?id=${hashedLicense}`);

  if (!response.ok) {
    throw new Error(`Failed to check backup node status: ${response.statusText}`);
  }
  const data = await response.json();

  const result: Record<Network, BeaconBackupNetworkStatus> = {} as Record<Network, BeaconBackupNetworkStatus>;

  Object.entries(data.networks).forEach(([network, status]) => {
    console.log("Beacon backup status data for", network, ":", status);

    const typedStatus = status as {
      validator_limit: number;
      time_left: number;
      isActivable: boolean;
      active: boolean;
      activation_history: Array<{
        activation_date: string;
        end_date: string;
      }>;
    };
    result[network as Network] = {
      validatorLimit: typedStatus.validator_limit,
      isActivable: typedStatus.active === false && typedStatus.time_left > 0,
      isActive: typedStatus.active,
      activationHistory: typedStatus.activation_history,
      timeLeft: typedStatus.time_left || 60
    };
  });

  // const validatorLimit = data.ValidatorLimit;
  // const validUntilString = data.ValidUntil;
  // const validUntil = new Date(validUntilString);
  // const now = new Date();

  // const isZeroTime = validUntilString === "0001-01-01T00:00:00Z";

  // // Activation grace period (30 days after ValidUntil)
  // const gracePeriodEnd = new Date(validUntil.getTime() + 30 * 24 * 60 * 60 * 1000);
  // const hasPassedGracePeriod = now > gracePeriodEnd;

  // const isActivable = isZeroTime || hasPassedGracePeriod;
  // const isActive = validUntil > now;

  // const result: {
  //   validatorLimit: number;
  //   isActivable: boolean;
  //   secondsUntilActivable?: number;
  //   isActive: boolean;
  //   secondsUntilDeactivation?: number;
  // } = {
  //   validatorLimit,
  //   isActivable,
  //   isActive
  // };

  // if (!isActivable) {
  //   result.secondsUntilActivable = Math.floor((gracePeriodEnd.getTime() - now.getTime()) / 1000);
  // }

  // if (isActive) {
  //   result.secondsUntilDeactivation = Math.floor((validUntil.getTime() - now.getTime()) / 1000);
  // }

  // return result;
  console.log("Beacon backup status result:", result);

  return result;
};
