import { useEffect, useState } from "react";

type Browser = "Unknown" | "Chrome" | "Firefox" | "Safari" | "Edge" | "Opera" | "Brave";
type OS = "Unknown" | "Windows" | "macOS" | "iOS" | "Android" | "Linux";

interface BraveNavigator extends Navigator {
  brave?: {
    isBrave: () => Promise<boolean>;
  };
}

const useDeviceInfo = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [browser, setBrowser] = useState<Browser>("Unknown");
  const [os, setOS] = useState<OS>("Unknown");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userAgent = navigator.userAgent;

    const detectBrowser = async () => {
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
        const braveNavigator = navigator as BraveNavigator;
        if (braveNavigator.brave && typeof braveNavigator.brave.isBrave === "function") {
          try {
            const isBrave = await braveNavigator.brave.isBrave();
            browser = isBrave ? "Brave" : "Chrome";
          } catch {
            browser = "Chrome";
          }
        } else {
          browser = "Chrome";
        }
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
    if (os === "iOS" || os === "Android") {
      setIsMobile(true);
    } else {
      setIsMobile(false);
    }
  }, [os]);

  return {
    isMobile,
    browser,
    os,
    loading,
    device: isMobile ? "Mobile" : "Desktop",
    isCompatible: ["Chrome", "Edge", "Brave"].includes(browser)
  };
};

export default useDeviceInfo;
