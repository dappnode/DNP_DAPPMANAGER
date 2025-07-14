// src/contexts/PwaInstallContext.tsx
import React, { createContext, useState, useEffect, useCallback, useContext, ReactNode } from "react";

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
  installLoading: boolean;
  wasInstalled: boolean;
  promptInstall: () => Promise<void>;
}

const PwaInstallContext = createContext<PwaInstallContextValue>({
  isPwa: false,
  canInstall: false,
  installLoading: false,
  wasInstalled: false,
  promptInstall: async () => {}
});

export const PwaInstallProvider = ({ children }: { children: ReactNode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPwa, setIsPwa] = useState(false);
  const [wasInstalled, setWasInstalled] = useState(false);
  const [installLoading, setInstallLoading] = useState(false);

  useEffect(() => {
    // 1) Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("SW registered:", reg.scope))
        .catch((err) => console.error("SW registration failed:", err));
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
      const navStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsPwa(mediaQuery.matches || navStandalone);
    };
    mediaQuery.addEventListener("change", updateIsPwa);
    updateIsPwa();

    // 4) capture the appinstalled event
    const onAppInstalled = () => {
      setInstallLoading(true);
      setTimeout(() => {
        console.log("PWA was installed 🎉");
        setWasInstalled(true);
        setInstallLoading(false);
      }, 6000); // Delay to ensure the app is fully installed
    };
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      mediaQuery.removeEventListener("change", updateIsPwa);
      window.removeEventListener("appinstalled", onAppInstalled);
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
    <PwaInstallContext.Provider
      value={{
        isPwa,
        canInstall: deferredPrompt !== null,
        wasInstalled,
        installLoading,
        promptInstall
      }}
    >
      {children}
    </PwaInstallContext.Provider>
  );
};

export const usePwaInstall = () => useContext(PwaInstallContext);
