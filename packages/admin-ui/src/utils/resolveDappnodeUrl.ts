/**
 * Redirects or keeps the original URL depending on whether it contains "my.dappnode"
 * and compares it to the current location's origin to redirect to the PWA domain if user was already there.
 *
 * @param originalUrl - The original URL that might need modification.
 * @param currentLocation - The current location (e.g., from window.location).
 * @returns A potentially modified URL string.
 */
export function resolveDappnodeUrl(originalUrl: string, currentLocation: Location): string {
  try {
    if (!originalUrl.includes("my.dappnode")) {
      return originalUrl;
    }

    const originalParsed = new URL(originalUrl);

    if (currentLocation.hostname.includes("my.dappnode")) {
      return originalUrl;
    }

    originalParsed.hostname = currentLocation.hostname;
    originalParsed.protocol = currentLocation.protocol;

    return originalParsed.toString();
  } catch (e) {
    console.error("Failed to resolve Dappnode URL:", e);
    return originalUrl; // Fallback to original URL in case of error
  }
}
