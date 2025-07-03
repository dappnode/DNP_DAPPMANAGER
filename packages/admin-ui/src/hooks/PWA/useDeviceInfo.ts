import { useState, useEffect } from "react";

type Browser = "Unknown" | "Chrome" | "Firefox" | "Safari" | "Edge";

const useDeviceInfo = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [browser, setBrowser] = useState<Browser>("Unknown");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userAgent = navigator.userAgent;

    console.log("User agent:", userAgent);

    // Check for mobile devices
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent);

    // Determine browser type
    let browser: Browser = "Unknown";

    if (/Chrome|Chromium|CriOS/i.test(userAgent)) {
      browser = "Chrome";
    } else if (/Firefox/i.test(userAgent)) {
      browser = "Firefox";
    } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
      browser = "Safari";
    } else if (/Edge/i.test(userAgent)) {
      browser = "Edge";
    }

    // Set the device info
    setBrowser(browser);
    setIsMobile(isMobile);
    setLoading(false);
  }, []);

  return {
    isMobile,
    browser,
    loading
  };
};

export default useDeviceInfo;
