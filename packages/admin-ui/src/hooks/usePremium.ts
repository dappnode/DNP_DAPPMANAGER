import { api, useApi } from "api";
import { continueIfCalleDisconnected } from "api/utils";
import { withToast } from "components/toast/Toast";
import { premiumDnpName } from "params";
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { prettyDnpName } from "utils/format";

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
  deactivateLicenseKey: () => Promise<void>;
  hashedLicense: string;
} => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [licenseKey, setLicenseKey] = useState<string>("");
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [hashedLicense, setHashedLicense] = useState<string>("");

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
    if (premiumActiveReq.data) {
      setIsActivated(premiumActiveReq.data);
    }
  }, [premiumActiveReq.data]);

  useEffect(() => {
    if (!licenseKeyReq.data) return;

    if (licenseKeyReq.data.key) {
      setLicenseKey(licenseKeyReq.data.key);
    } else {
      const searchParams = new URLSearchParams(window.location.search);
      const license = searchParams.get("license");
      if (license && /^[A-F0-9]{6}-[A-F0-9]{6}-[A-F0-9]{6}-[A-F0-9]{6}-[A-F0-9]{6}-V\d+$/i.test(license)) {
        setLicenseKey(license);
      }
    }

    if (licenseKeyReq.data.hash) setHashedLicense(licenseKeyReq.data.hash);
  }, [licenseKeyReq.data]);

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
    return withToast(
      continueIfCalleDisconnected(() => api.premiumSetLicenseKey(licenseKey), premiumDnpName),
      {
        message: "Setting license key...",
        onSuccess: "License key set successfully",
        onError: "Error while setting license key"
      }
    );
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
    try {
      await putLicenseKey(licenseKey);
      await activateLicenseKey();
      await premiumActiveReq.revalidate();
    } catch (error) {
      console.error(`Error while activating license key: ${error}`);
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
    deactivateLicenseKey,
    hashedLicense
  };
};
