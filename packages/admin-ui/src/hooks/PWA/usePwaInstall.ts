// hooks/usePwaInstall.ts
import { useState, useEffect, useCallback } from "react";

// 1) Extend the native Event with the prompt API
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isPwa, setIsPwa] = useState<boolean>(false);

  useEffect(() => {
    // a) Capture the beforeinstallprompt event
    const beforeInstallHandler = (e: Event) => {
      e.preventDefault(); // stop auto-show
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", beforeInstallHandler);

    // Detect if running pwa
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const updateIsPwa = () => {
      // iOS
      const navStandalone = (window.navigator as any)?.standalone === true;
      setIsPwa(mediaQuery.matches || navStandalone);
    };
    mediaQuery.addEventListener("change", updateIsPwa);
    updateIsPwa();

    
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstallHandler);
      mediaQuery.removeEventListener("change", updateIsPwa);
    };
  }, []);

  
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      console.log("🎉 User accepted the install prompt");
    } else {
      console.log("😞 User dismissed the install prompt");
    }
    setDeferredPrompt(null); // can only prompt once
  }, [deferredPrompt]);

  return {
    isPwa,
    canInstall: !!deferredPrompt,
    promptInstall, 
  };
}
