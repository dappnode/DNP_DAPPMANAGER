import { createConnection } from "net";

// Tor SOCKS5 proxy port
const TOR_SOCKS_PORT = 9050;

/**
 * Check if Tor SOCKS proxy is available on localhost:9050
 */
export function isTorAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port: TOR_SOCKS_PORT }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => {
      resolve(false);
    });
    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}
