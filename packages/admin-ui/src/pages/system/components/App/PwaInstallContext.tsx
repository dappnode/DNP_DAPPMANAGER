// src/contexts/PwaInstallContext.tsx
import React, { createContext, useState, useEffect, useCallback, useContext, ReactNode } from "react";

// extend the browser event…
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaInstallContextValue {
  isPwa: boolean;
  canInstall: boolean;
  promptInstall: () => Promise<void>;
}

const PwaInstallContext = createContext<PwaInstallContextValue>({
  isPwa: false,
  canInstall: false,
  promptInstall: async () => {}
});

export const PwaInstallProvider = ({ children }: { children: ReactNode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPwa, setIsPwa] = useState(false);

  useEffect(() => {
    // 1) register your Service Worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => console.log("SW registered:", reg.scope))
          .catch((err) => console.error("SW registration failed:", err));
      });
    }

    // 2) capture the beforeinstallprompt event
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // 3) detect standalone mode (Chrome + iOS)
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const updateIsPwa = () => {
      const navStandalone = (window.navigator as any)?.standalone === true;
      setIsPwa(mediaQuery.matches || navStandalone);
    };
    mediaQuery.addEventListener("change", updateIsPwa);
    updateIsPwa();

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      mediaQuery.removeEventListener("change", updateIsPwa);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    console.log(choice.outcome === "accepted" ? "🎉 accepted" : "😞 dismissed");
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return (
    <PwaInstallContext.Provider value={{ isPwa, canInstall: deferredPrompt !== null, promptInstall }}>
      {children}
    </PwaInstallContext.Provider>
  );
};

export const usePwaInstall = () => useContext(PwaInstallContext);
