import { api, useApi } from "api";
import { continueIfCalleDisconnected } from "api/utils";
import { withToast } from "components/toast/Toast";
import { premiumDnpName } from "params";
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { prettyDnpName } from "utils/format";
import { confirm } from "components/ConfirmDialog";

export const usePremium = (): {
  isLoading: boolean;
  isInstalled: boolean;
  isInstalling: boolean;
  installPremiumPkg: () => Promise<void>;
  isRunning: boolean;
  licenseKey: string;
  setLicenseKey: Dispatch<SetStateAction<string>>;
  isActivated: boolean;
  handleActivate: () => Promise<void>;
  handleDectivate: () => Promise<void>;
  isActivationLoading: boolean;
  hashedLicense: string;
  activateTimeout: number;
  licenseActivationError: string | null;
} => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [licenseKey, setLicenseKey] = useState<string>("");
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [isActivationLoading, setIsActivationLoading] = useState<boolean>(true);
  const [licenseActivationError, setLicenseActivationError] = useState<string | null>(null);
  const [hashedLicense, setHashedLicense] = useState<string>("");

  // Timeout used to prevent the user from activating/deactivating the license key multiple times in a short
  const [activateTimeout, setActivateTimeout] = useState<number>(-1);
  const timeoutDuration = 12; // seconds

  const premiumPkgReq = useApi.premiumPkgStatus();
  const premiumActiveReq = useApi.premiumIsLicenseActive();
  const licenseKeyReq = useApi.premiumGetLicenseKey();

  useEffect(() => {
    setIsLoading(premiumPkgReq.isValidating);
  }, [premiumPkgReq.isValidating]);

  useEffect(() => {
    if (premiumPkgReq.data) {
      setIsInstalled(premiumPkgReq.data.premiumDnpInstalled);
      setIsRunning(premiumPkgReq.data.premiumDnpRunning);
    }
  }, [premiumPkgReq.data]);

  useEffect(() => {
    if (premiumActiveReq.data !== undefined) {
      setIsActivated(premiumActiveReq.data);
    }
  }, [premiumActiveReq.data]);

  useEffect(() => {
    setIsActivationLoading(premiumActiveReq.isValidating);
  }, [premiumActiveReq.isValidating]);

  useEffect(() => {
    if (!licenseKeyReq.data) return;

    if (licenseKeyReq.data.key) {
      setLicenseKey(licenseKeyReq.data.key);
    } else {
      const searchParams = new URLSearchParams(window.location.search);
      const license = searchParams.get("license");
      license && setLicenseKey(license);
    }

    if (licenseKeyReq.data.hash) setHashedLicense(licenseKeyReq.data.hash);
  }, [licenseKeyReq.data]);

  useEffect(() => {
    if (activateTimeout <= 0) return;

    const timer = setTimeout(() => {
      setActivateTimeout((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [activateTimeout]);

  const installPremiumPkg = useCallback(async (): Promise<void> => {
    try {
      setIsInstalling(true);
      await withToast(
        continueIfCalleDisconnected(
          () =>
            api.packageInstall({
              name: premiumDnpName
            }),
          premiumDnpName
        ),
        {
          message: `Installing ${prettyDnpName(premiumDnpName)}...`,
          onSuccess: `Installed ${prettyDnpName(premiumDnpName)}`,
          onError: `Error while installing ${prettyDnpName(premiumDnpName)}`
        }
      );
    } catch (error) {
      console.error(`Error while installing ${prettyDnpName(premiumDnpName)} package: ${error}`);
    } finally {
      setTimeout(async () => {
        await premiumPkgReq.revalidate();
        setIsInstalling(false);
      }, 5000); // Wait 5 seconds before checking again, since it can take some time for the package to start
    }
  }, [isInstalled]);

  const putLicenseKey = (licenseKey: string): Promise<void> => {
    return continueIfCalleDisconnected(() => api.premiumSetLicenseKey(licenseKey), premiumDnpName)();
  };

  const activateLicenseKey = (): Promise<void> => {
    return withToast(() => api.premiumActivateLicense(), {
      message: "Activating license key...",
      onSuccess: "License key activated successfully",
      onError: "Error while activating license key"
    });
  };

  const deactivateLicenseKey = (): Promise<void> => {
    return withToast(() => api.premiumDeactivateLicense(), {
      message: "Deactivating license key...",
      onSuccess: "License key deactivated successfully",
      onError: "Error while deactivating license key"
    });
  };

  const handleActivate = async (): Promise<void> => {
    setLicenseActivationError(null);
    try {
      await putLicenseKey(licenseKey);
      await activateLicenseKey();
      premiumActiveReq.revalidate();
      licenseKeyReq.revalidate();
      setActivateTimeout(timeoutDuration);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Internal server error";

      console.error("Error while activating license key:", error);
      setLicenseActivationError(msg);
    }
  };

  const handleDectivate = async (): Promise<void> => {
    try {
      confirm({
        title: `Deactivate Premium license`,
        text: `Are you sure you want to deactivate the premium license on this Dappnode?`,
        label: "Deactivate",
        variant: "danger",
        onClick: async () => {
          await deactivateLicenseKey();
          premiumActiveReq.revalidate();
          setActivateTimeout(timeoutDuration);
        }
      });
    } catch (error) {
      console.error(`Error while deactivating license key: ${error}`);
    }
  };

  return {
    isLoading,
    isInstalled,
    isInstalling,
    installPremiumPkg,
    isRunning,
    isActivated,
    licenseKey,
    setLicenseKey,
    handleActivate,
    handleDectivate,
    isActivationLoading,
    hashedLicense,
    activateTimeout,
    licenseActivationError
  };
};
