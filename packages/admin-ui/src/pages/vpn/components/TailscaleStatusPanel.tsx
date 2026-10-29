import React, { useEffect, useRef, useState } from "react";
import type { InstalledPackageDetailData } from "@dappnode/types";
import { parseTailscaleStatus, tailscaleStatusKey } from "../tailscaleStatus";

export function TailscaleStatusPanel({
  dnp,
  unavailable = false
}: {
  dnp: InstalledPackageDetailData;
  unavailable?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now() / 1000);
  // Revalidate while idle, even when websocket events/heartbeats stop entirely.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => clearInterval(interval);
  }, []);

  const status = parseTailscaleStatus(dnp.packageSentData?.[tailscaleStatusKey], Math.max(now, Date.now() / 1000));
  const tailscale = dnp.containers.find((container) => container.serviceName === "tailscale");
  const reporter = dnp.containers.find((container) => container.serviceName === "reporter");
  const servicesRunning = [tailscale, reporter].every((service) => service?.state === "running");
  // Do not redisplay a cached link after an observed service restart. Require a
  // newly sampled report, even if the previous report has not expired yet.
  const invalidatedAt = useRef(0);
  if (!servicesRunning) invalidatedAt.current = Math.max(invalidatedAt.current, Date.now() / 1000);

  let message: string;
  let authUrl: string | null = null;
  let needsApproval = false;
  if (unavailable) {
    message = "Tailscale status unavailable. Waiting for a successful refresh.";
  } else if (!reporter) {
    message = "Upgrade the Tailscale package to enable browser sign-in. You can still configure an auth key below.";
  } else if (!servicesRunning) {
    const starting = [tailscale, reporter].some((service) => ["restarting", "created"].includes(service?.state ?? ""));
    message = starting
      ? "Tailscale services are starting. Preparing sign-in…"
      : "Tailscale or its status reporter is stopped. Start both services to see status.";
  } else if (!status || status.updatedAt <= invalidatedAt.current || status.state === "Unavailable") {
    message = "Tailscale status unavailable. Waiting for a fresh report.";
  } else {
    switch (status.state) {
      case "NeedsLogin":
        authUrl = status.authUrl;
        message = authUrl ? "Sign in to connect your Dappnode to your tailnet." : "Preparing Tailscale sign-in…";
        break;
      case "NeedsMachineAuth":
        message = "Awaiting device approval in the Tailscale admin console.";
        needsApproval = true;
        break;
      case "Running":
        message = status.online ? "Connected to Tailscale." : "Tailscale is offline. Reconnecting…";
        break;
      case "Stopped":
        message = "Tailscale stopped.";
        break;
      default:
        message = "Connecting to Tailscale. Preparing sign-in…";
    }
  }

  return (
    <section aria-label="Tailscale status" className="card card-body">
      <h3>Tailscale status</h3>
      <p role="status">{message}</p>
      {authUrl && (
        <a
          className="btn btn-dappnode align-self-start"
          href={authUrl}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
        >
          Sign in to Tailscale
        </a>
      )}
      {needsApproval && (
        <a href="https://login.tailscale.com/admin/machines" target="_blank" rel="noopener noreferrer">
          Open Tailscale admin console
        </a>
      )}
      <p className="mt-3 mb-0">
        After sign-in, approve subnet routes and configure tailnet DNS using the setup guide. Connected status does not
        confirm routing or DNS access.
      </p>
      <p className="mt-2 mb-0">
        An auth key is optional. If a key is rejected, clear TS_AUTHKEY (and TS_AUTH_KEY if set) in configuration, then
        restart the package to use browser sign-in.
      </p>
    </section>
  );
}
