export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Worker is not supported in this browser.");
    return null;
  }

  try {
    let swRegistration = await navigator.serviceWorker.getRegistration();
    if (!swRegistration) {
      console.log("Registering Service Worker...");
      swRegistration = await navigator.serviceWorker.register("/service-worker.js");
      console.log("Service Worker registered:", swRegistration);
    }
    return swRegistration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
}
