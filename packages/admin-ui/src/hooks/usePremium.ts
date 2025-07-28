import { useEffect, useState } from "react";

export const usePremium = (): {
  isLoading: boolean;
  isInstalled: boolean;
  isRunning: boolean;
  isActivated: boolean;
  prefilledLicense: string | null;
} => {
  const [prefilledLicense, setPrefilledLicense] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const license = searchParams.get("license");
    if (license && /^[A-F0-9]{6}-[A-F0-9]{6}-[A-F0-9]{6}-[A-F0-9]{6}-[A-F0-9]{6}-V\d+$/i.test(license)) {
      setPrefilledLicense(license);
    }
  }, []);

  const isLoading = false;
  const isInstalled = true;
  const isRunning = true;
  const isActivated = false;

  return {
    isLoading,
    isInstalled,
    isRunning,
    isActivated,
    prefilledLicense
  };
};
