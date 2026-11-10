import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowForward, MdOpenInNew, MdSync } from "react-icons/md";
import Card from "components/Card";
import Button from "components/Button";
import SubTitle from "components/SubTitle";
import type { InstalledPackageDetailData } from "@dappnode/types";
import { docsUrl, externalUrlProps } from "params";
import { parseTailscaleStatus, tailscaleStatusKey } from "../tailscaleStatus";

type ConnectionView = {
  title: string;
  description: string;
  label: string;
  tone: "green" | "yellow" | "red";
  action: "signin" | "approve" | "manage" | "retry" | "wait" | "devices";
  hint?: string;
};

const views = {
  login: {
    title: "Connect your Dappnode",
    description: "Sign in with your Tailscale account to connect this Dappnode.",
    label: "Sign-in needed",
    tone: "yellow",
    action: "signin",
    hint: "Finish signing in in the new tab. This page will update automatically."
  },
  preparing: {
    title: "Getting Tailscale ready",
    description: "Your sign-in link will appear here automatically. This usually takes a moment.",
    label: "Preparing",
    tone: "yellow",
    action: "wait"
  },
  approval: {
    title: "Approve this Dappnode",
    description: "You're signed in. Your Tailscale administrator needs to approve this device before it can connect.",
    label: "Approval needed",
    tone: "yellow",
    action: "approve"
  },
  connected: {
    title: "Connected to Tailscale",
    description: "Your Dappnode is signed in and online. Use Tailscale on your phone or laptop to reach it remotely.",
    label: "Connected",
    tone: "green",
    action: "devices",
    hint: "Remote access also needs approved subnet routes and tailnet DNS. The setup guide walks you through both."
  },
  offline: {
    title: "Reconnecting to Tailscale",
    description: "Your Dappnode is signed in but offline. Tailscale will try to reconnect automatically.",
    label: "Reconnecting",
    tone: "yellow",
    action: "retry"
  },
  stopped: {
    title: "Tailscale is stopped",
    description: "Open the Tailscale package and start its services to reconnect.",
    label: "Stopped",
    tone: "red",
    action: "manage"
  },
  serviceStopped: {
    title: "Connection check stopped",
    description: "A Tailscale package service is stopped. Open the package to start it and check your connection.",
    label: "Service stopped",
    tone: "red",
    action: "manage"
  },
  legacy: {
    title: "Update Tailscale for browser sign-in",
    description: "Update the package to sign in here, or use an auth key in Advanced settings below.",
    label: "Older package",
    tone: "yellow",
    action: "manage"
  },
  unavailable: {
    title: "Waiting for connection status",
    description:
      "We haven't received a recent update from Tailscale. Check again, or open the package for more details.",
    label: "Status unavailable",
    tone: "red",
    action: "retry"
  },
  error: {
    title: "We couldn't check your connection",
    description: "Your connection may still be active. Try again to get the latest status.",
    label: "Unable to check",
    tone: "red",
    action: "retry"
  }
} satisfies Record<string, ConnectionView>;

export function TailscaleStatusPanel({
  dnp,
  unavailable = false,
  refreshing = false,
  onRefresh
}: {
  dnp: InstalledPackageDetailData;
  unavailable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => Date.now() / 1000);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => clearInterval(interval);
  }, []);

  const status = parseTailscaleStatus(dnp.packageSentData?.[tailscaleStatusKey], Math.max(now, Date.now() / 1000));
  const tailscale = dnp.containers.find((container) => container.serviceName === "tailscale");
  const reporter = dnp.containers.find((container) => container.serviceName === "reporter");
  const servicesRunning = [tailscale, reporter].every((service) => service?.state === "running");
  // Require a new observation after a service restart, even if the cached link is still fresh.
  const invalidatedAt = useRef(0);
  if (!servicesRunning) invalidatedAt.current = Math.max(invalidatedAt.current, Date.now() / 1000);

  let view: ConnectionView;
  if (unavailable) view = views.error;
  else if (!reporter) view = views.legacy;
  else if (!servicesRunning) {
    view = [tailscale, reporter].some((service) => ["restarting", "created"].includes(service?.state ?? ""))
      ? views.preparing
      : tailscale?.state !== "running"
        ? views.stopped
        : views.serviceStopped;
  } else if (!status || status.updatedAt <= invalidatedAt.current || status.state === "Unavailable") {
    view = views.unavailable;
  } else {
    switch (status.state) {
      case "NeedsLogin":
        view = status.authUrl ? views.login : views.preparing;
        break;
      case "NeedsMachineAuth":
        view = views.approval;
        break;
      case "Running":
        view = status.online ? views.connected : views.offline;
        break;
      case "Stopped":
        view = views.stopped;
        break;
      default:
        view = views.preparing;
    }
  }

  const externalLinkProps = { ...externalUrlProps, referrerPolicy: "no-referrer" as const };
  return (
    <section aria-label="Tailscale connection" className="tailscale-connection">
      <div className="tailscale-connection__header">
        <SubTitle>Tailscale connection</SubTitle>
        <span className="tailscale-connection__status">
          <span className="tailscale-lights" aria-hidden="true">
            {(["red", "yellow", "green"] as const).map((color) => (
              <span
                key={color}
                className={`tailscale-light tailscale-light--${color}${view.tone === color ? " is-active" : ""}`}
              />
            ))}
          </span>
          {view.label}
        </span>
      </div>
      <Card spacing>
        <div role="status">
          <h5>{view.title}</h5>
          <p className="mb-0">{view.description}</p>
        </div>
        <div className="tailscale-connection__actions">
          {view.action === "signin" &&
            (refreshing ? (
              <Button variant="dappnode" disabled>
                Sign in to Tailscale <MdSync aria-hidden="true" className="tailscale-spinning" />
              </Button>
            ) : (
              <a className="btn btn-dappnode" href={status?.authUrl ?? undefined} {...externalLinkProps}>
                Sign in to Tailscale <MdOpenInNew aria-hidden="true" />
              </a>
            ))}
          {view.action === "approve" && (
            <a className="btn btn-dappnode" href="https://login.tailscale.com/admin/machines" {...externalLinkProps}>
              Approve device <MdOpenInNew aria-hidden="true" />
            </a>
          )}
          {view.action === "devices" && (
            <a className="btn btn-dappnode" href={docsUrl.tailscaleVpn} {...externalLinkProps}>
              Connect another device <MdArrowForward aria-hidden="true" />
            </a>
          )}
          {view.action === "manage" && (
            <Button variant="dappnode" onClick={() => navigate(`/packages/my/${dnp.dnpName}/info`)}>
              Open Tailscale package <MdArrowForward aria-hidden="true" />
            </Button>
          )}
          {view.action === "retry" && onRefresh && (
            <Button variant="outline-secondary" onClick={onRefresh} disabled={refreshing}>
              <MdSync aria-hidden="true" className={refreshing ? "tailscale-spinning" : undefined} />
              {refreshing ? "Checking…" : "Check again"}
            </Button>
          )}
          {view.action === "wait" && (
            <span className="text-muted">
              <MdSync aria-hidden="true" className="tailscale-spinning" /> Preparing connection…
            </span>
          )}
        </div>
        {view.hint && <p className="small text-muted mb-0">{view.hint}</p>}
      </Card>
    </section>
  );
}
