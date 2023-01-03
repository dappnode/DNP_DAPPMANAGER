import memoize from "memoizee";
import { AvahiDaemonStatus } from "@dappnode/common";
import { runScript } from "../runScripts";

/**
 * Initializes AVAHI daemon:
 * - Install avahi utils if necessary
 * - Edit /etc/hosts and /etch/avahi/avahi-daemon.conf if necessary
 * - Starts avahi daemon
 */
export const initializeAvahiDaemon = memoize(
  async function (): Promise<string> {
    return await runScript("avahi_daemon.sh", "-- --initialize");
  },
  // Prevent running this script more than once
  { promise: true, maxAge: 2000 }
);

/**
 * Get AVAHI daemon status:
 * - avahi daemon running
 * - avahi daemon enabled
 * - avahi daemon resolves
 */
export const getAvahiDaemonStatus = memoize(
  async function (): Promise<AvahiDaemonStatus> {
    const avahiDaemonStatus = await runScript("avahi_daemon.sh", "-- --status");

    const status: {
      isAvahiRunning: "true" | "false";
      isAvahiEnabled: "true" | "false";
      avahiResolves: "true" | "false";
    } = JSON.parse(avahiDaemonStatus);

    return {
      isAvahiRunning: status.isAvahiRunning === "true",
      isAvahiEnabled: status.isAvahiEnabled === "true",
      avahiResolves: status.avahiResolves === "true"
    };
  },
  // Prevent running this script more than once
  { promise: true, maxAge: 2000 }
);

/**
 * Stop AVAHI daemon
 * - Stop and disables avahi-daemon.service and avahi-socket.service (both necessary to fully stop avahi)
 */
export const stopAvahiDaemon = memoize(
  async function (): Promise<string> {
    return await runScript("avahi_daemon.sh", "-- --stop");
  },
  // Prevent running this script more than once
  { promise: true, maxAge: 2000 }
);

/**
 * Start AVAHI daemon
 * - Start and enables avahi-daemon.service and avahi-socket.service
 */
export const startAvahiDaemon = memoize(
  async function (): Promise<string> {
    return await runScript("avahi_daemon.sh", "-- --start");
  },
  // Prevent running this script more than once
  { promise: true, maxAge: 2000 }
);

/**
 * Restarts AVAHI daemon
 */
export const restartAvahiDaemon = memoize(
  async function (): Promise<string> {
    return await runScript("avahi_daemon.sh", "-- --restart");
  },
  // Prevent running this script more than once
  { promise: true, maxAge: 2000 }
);
