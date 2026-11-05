import { useEffect, useMemo, useState } from "react";

export type Browser = "Unknown" | "Chrome" | "Firefox" | "Safari" | "Edge" | "Opera" | "Brave";
export type OS = "Unknown" | "Windows" | "macOS" | "iOS" | "Android" | "Linux";

const compatibilityMap: Record<OS, Browser[]> = {
  Windows: ["Chrome", "Edge", "Brave"],
  Linux: ["Chrome", "Brave"],
  Android: ["Chrome", "Edge", "Brave"],
  macOS: ["Chrome", "Edge", "Brave", "Safari"],
  iOS: ["Chrome", "Safari"],
  Unknown: []
};

const useDeviceInfo = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [browser, setBrowser] = useState<Browser>("Unknown");
  const [os, setOS] = useState<OS>("Unknown");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userAgent = navigator.userAgent;

    const detectBrowser = async (): Promise<Browser> => {
      if ("brave" in navigator) {
        try {
          if (await (navigator.brave as { isBrave: () => Promise<boolean> }).isBrave()) {
            return "Brave";
          }
        } catch {
          console.error("Error detecting Brave browser");
        }
      }

      let browser: Browser = "Unknown";

      if (/Edg\//i.test(userAgent)) {
        browser = "Edge";
      } else if (/OPR/i.test(userAgent) || /Opera/i.test(userAgent)) {
        browser = "Opera";
      } else if (/Firefox/i.test(userAgent)) {
        browser = "Firefox";
      } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
        browser = "Safari";
      } else if (/Chrome|Chromium|CriOS/i.test(userAgent)) {
        browser = "Chrome";
      }

      return browser;
    };

    const detectOS = (): OS => {
      if (/Windows NT/i.test(userAgent)) return "Windows";
      if (/Mac OS X/i.test(userAgent)) {
        if (navigator.maxTouchPoints > 1) {
          return "iOS"; // iPads && iPhones have touch support
        } else {
          return "macOS";
        }
      }
      if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS";
      if (/Android/i.test(userAgent)) return "Android";
      if (/Linux/i.test(userAgent)) return "Linux";
      return "Unknown";
    };

    detectBrowser().then((browser) => {
      setBrowser(browser);
      setOS(detectOS());
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    // Set device type based on OS
    setIsMobile(os === "iOS" || os === "Android");
  }, [os]);

  const supportedBrowsers = useMemo<Browser[]>(() => compatibilityMap[os], [os]);
  const isCompatible = useMemo<boolean>(() => supportedBrowsers.includes(browser), [supportedBrowsers, browser]);

  return {
    isMobile,
    browser,
    os,
    loading,
    device: isMobile ? "Mobile" : "Desktop",
    isCompatible,
    supportedBrowsers
  };
};

export default useDeviceInfo;
