import { useEffect, useState } from "react";

type Browser = "Unknown" | "Chrome" | "Firefox" | "Safari" | "Edge" | "Opera";
type OS = "Unknown" | "Windows" | "macOS" | "iOS" | "Android" | "Linux";

const useDeviceInfo = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [browser, setBrowser] = useState<Browser>("Unknown");
  const [os, setOS] = useState<OS>("Unknown");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userAgent = navigator.userAgent;

    const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent);

    let browser: Browser = "Unknown";
    if (/Edg\//i.test(userAgent)) {
      browser = "Edge";
    } else if (/Chrome|Chromium|CriOS/i.test(userAgent) && !/Edg\//i.test(userAgent)) {
      browser = "Chrome";
    } else if (/Firefox/i.test(userAgent)) {
      browser = "Firefox";
    } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
      browser = "Safari";
    } else if (/OPR/i.test(userAgent) || /Opera/i.test(userAgent)) {
      browser = "Opera";
    }

    let os: OS = "Unknown";
    if (/Windows NT/i.test(userAgent)) {
      os = "Windows";
    } else if (/Mac OS X/i.test(userAgent) && !/Mobile/i.test(userAgent)) {
      os = "macOS";
    } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
      os = "iOS";
    } else if (/Android/i.test(userAgent)) {
      os = "Android";
    } else if (/Linux/i.test(userAgent)) {
      os = "Linux";
    }

    setIsMobile(isMobile);
    setBrowser(browser);
    setOS(os);
    setLoading(false);
  }, []);

  return {
    isMobile,
    browser,
    os,
    loading,
    device: isMobile ? "Mobile" : "Desktop",
    isChromium: browser === "Chrome" || browser === "Edge" || browser === "Opera"
  };
};

export default useDeviceInfo;
