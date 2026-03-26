import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "api";
import { useSelector } from "react-redux";
import { getVolumes } from "services/dappnodeStatus/selectors";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { flatten, uniqBy, orderBy } from "lodash-es";
import {
  InstalledPackageDetailData,
  InstalledPackageData,
  Manifest,
  PackageContainer,
  upstreamVersionToString
} from "@dappnode/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Badge } from "components/primitives/badge";
import { Separator } from "components/primitives/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "components/primitives/alert-dialog";
import { parseContainerState, SimpleState } from "pages/packages/components/StateBadge/utils";
import { prettyDnpName, prettyFullName, prettyVolumeName, prettyBytes } from "utils/format";
import { continueIfCalleDisconnected } from "api/utils";
import { isSecret } from "utils/isSecret";
import { isLink } from "utils/isLink";
import {
  ExternalLink,
  Home,
  Settings,
  Bug,
  Globe,
  Trash2,
  RefreshCw,
  Pause,
  Play,
  ChevronDown,
  ChevronUp,
  X,
  Copy,
  Eye,
  EyeOff,
  HardDrive
} from "lucide-react";

const ipfsGatewayUrl = "http://ipfs.dappnode:8080";

/* ── Main component ─────────────────────────────────────────────────── */

export function InfoTab({ dnp }: { dnp: InstalledPackageDetailData }) {
  const { manifest, gettingStarted, gettingStartedShow } = dnp;

  return (
    <div className="tw:flex tw:flex-col tw:gap-6">
      {/* Getting Started */}
      <GettingStartedSection
        dnpName={dnp.dnpName}
        gettingStarted={gettingStarted}
        gettingStartedShow={gettingStartedShow}
      />

      {/* Version & Links */}
      <VersionCard dnp={dnp} manifest={manifest} />

      {/* Package Sent Data */}
      <PackageSentDataCard dnpName={dnp.dnpName} data={dnp.packageSentData} />

      {/* Containers */}
      <ContainersCard dnp={dnp} />

      {/* Volumes */}
      <VolumesCard dnp={dnp} />

      {/* Remove package */}
      <RemovePackageCard dnp={dnp} />
    </div>
  );
}

/* ── Getting Started ────────────────────────────────────────────────── */

function GettingStartedSection({
  dnpName,
  gettingStarted,
  gettingStartedShow
}: {
  dnpName: string;
  gettingStarted?: string;
  gettingStartedShow?: boolean;
}) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setShow(Boolean(gettingStartedShow));
  }, [gettingStartedShow]);

  async function dismiss() {
    if (loading) return;
    try {
      setLoading(true);
      setShow(false);
      if (gettingStartedShow) await api.packageGettingStartedToggle({ dnpName, show: false });
    } catch (e) {
      console.error(`Error on packageGettingStartedToggle: ${e}`);
    } finally {
      setLoading(false);
    }
  }

  if (!gettingStarted) return null;

  if (!show) {
    return (
      <Button variant="link" onClick={() => setShow(true)}>
        Show getting started guide
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="tw:flex tw:flex-row tw:items-center tw:justify-between tw:space-y-0">
        <CardTitle>Getting started</CardTitle>
        <Button variant="ghost" size="icon" onClick={dismiss} disabled={loading}>
          <X className="tw:size-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="tw:prose tw:prose-sm tw:dark:prose-invert tw:max-w-none">
          <ReactMarkdown linkTarget="_blank">{gettingStarted}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Version & Links card ───────────────────────────────────────────── */

function VersionCard({ dnp, manifest }: { dnp: InstalledPackageDetailData; manifest?: Manifest }) {
  const { version, origin } = dnp;
  const { upstreamVersion, upstream, links, bugs } = manifest || {};

  const parsedUpstream = upstreamVersionToString({ upstreamVersion, upstream });

  // Build links array
  const linksArray = buildLinksArray(links, bugs);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Package Info</CardTitle>
      </CardHeader>
      <CardContent className="tw:flex tw:flex-col tw:gap-4">
        {/* Version */}
        <div className="tw:flex tw:items-baseline tw:gap-2 tw:text-sm">
          <span className="tw:font-medium">Version</span>
          <span className="tw:text-muted-foreground">
            {version}
            {parsedUpstream && ` (${parsedUpstream} upstream)`}
          </span>
          {origin && (
            <a
              href={`${ipfsGatewayUrl}${origin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tw:text-primary tw:hover:underline tw:text-xs"
            >
              {origin}
            </a>
          )}
        </div>

        {/* Links */}
        {linksArray.length > 0 && (
          <>
            <Separator />
            <div className="tw:flex tw:flex-wrap tw:gap-2">
              {linksArray.map(({ name, url, icon: Icon }) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-md tw:border tw:border-border tw:bg-muted/40 tw:px-3 tw:py-1.5 tw:text-xs tw:font-medium tw:text-foreground tw:transition-colors tw:hover:bg-muted"
                >
                  <Icon className="tw:size-3.5" />
                  {name}
                </a>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function buildLinksArray(
  links: Manifest["links"],
  bugs: Manifest["bugs"]
): { name: string; url: string; icon: React.FC<{ className?: string }> }[] {
  const arr: { name: string; url: string; icon: React.FC<{ className?: string }> }[] = [];

  const linksObj = typeof links === "string" ? { homepage: links } : typeof links === "object" ? links : {};

  for (const [name, url] of Object.entries(linksObj || {})) {
    if (!url) continue;
    const icon =
      name === "homepage" || name === "ui" || name === "webui"
        ? Home
        : name === "gateway"
        ? Globe
        : name === "api" || name === "apiEngine" || name === "engineAPI"
        ? Settings
        : ExternalLink;
    arr.push({ name, url, icon });
  }

  if (bugs?.url) {
    arr.push({ name: "Report bug", url: bugs.url, icon: Bug });
  }

  // Place homepage first
  arr.sort((a) => (a.name === "homepage" ? -1 : 0));
  return arr;
}

/* ── Package Sent Data ──────────────────────────────────────────────── */

function PackageSentDataCard({ dnpName, data }: { dnpName: string; data: Record<string, string> }) {
  const entries = Object.entries(data).sort((a, b) =>
    a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: "base" })
  );

  if (entries.length === 0) return null;

  async function handleDelete() {
    try {
      toast.loading("Deleting sent data…", { id: "delete-sent-data" });
      await api.packageSentDataDelete({ dnpName });
      toast.success("Deleted sent data", { id: "delete-sent-data" });
    } catch (e) {
      toast.error(`Failed: ${e}`, { id: "delete-sent-data" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Package Sent Data</CardTitle>
        <CardDescription>Values provided by the package at runtime.</CardDescription>
      </CardHeader>
      <CardContent className="tw:flex tw:flex-col tw:gap-3">
        {entries.map(([key, value]) => (
          <SentDataRow key={key} label={key} value={value} />
        ))}
        <Separator />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="tw:self-start tw:text-destructive tw:hover:text-destructive">
              Delete all sent data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="tw-base">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete sent data</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete all package-sent data? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function SentDataRow({ label, value }: { label: string; value: string }) {
  const secret = isSecret(label);
  const link = isLink(value);
  const [visible, setVisible] = useState(!secret);
  const [copied, setCopied] = useState(false);

  function copyValue() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="tw:flex tw:items-center tw:gap-3 tw:text-sm">
      <span className="tw:font-medium tw:min-w-32 tw:text-muted-foreground">{label}</span>
      <div className="tw:flex-1 tw:flex tw:items-center tw:gap-1.5 tw:min-w-0">
        {link ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="tw:text-primary tw:hover:underline tw:truncate"
          >
            {value}
          </a>
        ) : (
          <span className="tw:font-mono tw:text-xs tw:truncate">{visible ? value : "••••••••••"}</span>
        )}
        {!link && secret && (
          <Button variant="ghost" size="icon" className="tw:size-6" onClick={() => setVisible((v) => !v)}>
            {visible ? <EyeOff className="tw:size-3" /> : <Eye className="tw:size-3" />}
          </Button>
        )}
        {!link && (
          <Button variant="ghost" size="icon" className="tw:size-6" onClick={copyValue}>
            {copied ? <span className="tw:text-[10px] tw:text-green-600">✓</span> : <Copy className="tw:size-3" />}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Containers card ────────────────────────────────────────────────── */

const stateColors: Record<SimpleState, string> = {
  running: "tw:text-green-600 tw:dark:text-green-400",
  stopped: "tw:text-muted-foreground",
  crashed: "tw:text-destructive",
  restarting: "tw:text-amber-500",
  removing: "tw:text-muted-foreground"
};

function ContainersCard({ dnp }: { dnp: InstalledPackageData }) {
  const [expanded, setExpanded] = useState(false);
  const multiService = dnp.containers.length > 1;
  const allRunning = dnp.containers.every((c) => c.running);

  async function handleRestart(container?: PackageContainer) {
    const serviceNames = container ? [container.serviceName] : undefined;
    const name = container ? prettyFullName(container) : prettyDnpName(dnp.dnpName);

    if (dnp.containers.some((c) => c.running)) {
      // We still confirm destructive actions
      const confirmed = await new Promise<boolean>((resolve) => {
        // Using a simple window.confirm for now — the legacy `confirm()` dialog won't match the new UI
        resolve(window.confirm(`Restart ${name}? If this package holds state it may be lost.`));
      });
      if (!confirmed) return;
    }

    try {
      toast.loading(`Restarting ${name}…`, { id: `restart-${name}` });
      await continueIfCalleDisconnected(
        () => api.packageRestart({ dnpName: dnp.dnpName, serviceNames }),
        dnp.dnpName
      )();
      toast.success(`Restarted ${name}`, { id: `restart-${name}` });
    } catch (e) {
      toast.error(`Failed to restart ${name}: ${e}`, { id: `restart-${name}` });
    }
  }

  async function handleStartStop(container?: PackageContainer) {
    const serviceNames = container ? [container.serviceName] : undefined;
    const name = container ? prettyFullName(container) : prettyDnpName(dnp.dnpName);

    if (dnp.dnpName === "wifi.dnp.dappnode.eth") {
      const confirmed = window.confirm(
        "Warning: if you are connected via WiFi you will lose access. Make sure you have another way to connect."
      );
      if (!confirmed) return;
    }

    try {
      toast.loading(`Toggling ${name}…`, { id: `toggle-${name}` });
      await api.packageStartStop({ dnpName: dnp.dnpName, serviceNames });
      toast.success(`Toggled ${name}`, { id: `toggle-${name}` });
    } catch (e) {
      toast.error(`Failed: ${e}`, { id: `toggle-${name}` });
    }
  }

  function ContainerRow({ container, showName }: { container?: PackageContainer; showName: string }) {
    const state = container
      ? parseContainerState(container)
      : { state: allRunning ? ("running" as SimpleState) : ("stopped" as SimpleState) };
    const running = container ? container.running : allRunning;

    return (
      <div className="tw:flex tw:items-center tw:gap-3 tw:py-2">
        {/* Status */}
        <Badge variant="outline" className={`tw:capitalize tw:text-xs tw:font-medium ${stateColors[state.state]}`}>
          {state.state}
        </Badge>

        {/* Name */}
        <span className="tw:flex-1 tw:text-sm tw:font-medium tw:truncate">{showName}</span>

        {/* Start / Stop */}
        <Button
          variant="ghost"
          size="icon"
          className="tw:size-7"
          onClick={() => handleStartStop(container)}
          title={running ? "Pause" : "Start"}
        >
          {running ? <Pause className="tw:size-3.5" /> : <Play className="tw:size-3.5" />}
        </Button>

        {/* Restart */}
        <Button
          variant="ghost"
          size="icon"
          className="tw:size-7"
          onClick={() => handleRestart(container)}
          title="Restart"
        >
          <RefreshCw className="tw:size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Containers</CardTitle>
      </CardHeader>
      <CardContent className="tw:flex tw:flex-col tw:divide-y tw:divide-border">
        {/* Aggregate row */}
        <div className="tw:flex tw:items-center tw:gap-3 tw:py-2">
          <Badge
            variant="outline"
            className={`tw:capitalize tw:text-xs tw:font-medium ${stateColors[allRunning ? "running" : "stopped"]}`}
          >
            {allRunning ? "running" : "stopped"}
          </Badge>
          <span className="tw:flex-1 tw:text-sm tw:font-medium">
            {multiService ? "All containers" : prettyDnpName(dnp.dnpName)}
          </span>

          {multiService && (
            <Button variant="ghost" size="icon" className="tw:size-7" onClick={() => setExpanded((e) => !e)}>
              {expanded ? <ChevronUp className="tw:size-3.5" /> : <ChevronDown className="tw:size-3.5" />}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="tw:size-7"
            onClick={() => handleStartStop()}
            title={allRunning ? "Pause all" : "Start all"}
          >
            {allRunning ? <Pause className="tw:size-3.5" /> : <Play className="tw:size-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="tw:size-7" onClick={() => handleRestart()} title="Restart all">
            <RefreshCw className="tw:size-3.5" />
          </Button>
        </div>

        {/* Individual containers */}
        {expanded &&
          dnp.containers.map((c) => (
            <ContainerRow key={c.serviceName} container={c} showName={prettyDnpName(c.serviceName)} />
          ))}
      </CardContent>
    </Card>
  );
}

/* ── Volumes card ───────────────────────────────────────────────────── */

function VolumesCard({ dnp }: { dnp: InstalledPackageDetailData }) {
  const [expanded, setExpanded] = useState(false);
  const volumesData = useSelector(getVolumes);

  const volumes = uniqBy(flatten(dnp.containers.map((c) => c.volumes)), (v) => v.name)
    .filter((v) => v.name)
    .sort((v1) => (v1.name ? -1 : 1))
    .sort((v1) => ((v1.name || "").includes("data") ? -1 : 0))
    .map(({ name, container, host }) => {
      const vd = volumesData.find((v) => v.name === name);
      const prettyVol = prettyVolumeName(name || "", dnp.dnpName);
      const prettyStr = [prettyVol.owner, prettyVol.name].filter(Boolean).join(" – ");
      return {
        name: name || host,
        prettyName: name ? prettyStr : container || "Unknown",
        size: vd?.size
      };
    });

  if (volumes.length === 0) return null;

  const totalSize = volumes.reduce((s, v) => (v.size != null ? s + v.size : s), 0);

  async function handleRemoveVolumes(volumeName?: string) {
    const prettyName = prettyDnpName(dnp.dnpName);
    const confirmed = window.confirm(
      `Remove ${
        volumeName ? prettyDnpName(volumeName) : "all"
      } volume data for ${prettyName}? This cannot be undone. Blockchain nodes will re-sync from scratch.`
    );
    if (!confirmed) return;

    try {
      toast.loading(`Removing volumes of ${prettyName}…`, { id: "vol-rm" });
      await api.packageRestartVolumes({ dnpName: dnp.dnpName, volumeId: volumeName });
      toast.success(`Removed volumes of ${prettyName}`, { id: "vol-rm" });
    } catch (e) {
      toast.error(`Failed: ${e}`, { id: "vol-rm" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volumes</CardTitle>
      </CardHeader>
      <CardContent className="tw:flex tw:flex-col tw:divide-y tw:divide-border">
        {/* Aggregate row */}
        <div className="tw:flex tw:items-center tw:gap-3 tw:py-2">
          <HardDrive className="tw:size-4 tw:text-muted-foreground" />
          <span className="tw:flex-1 tw:text-sm tw:font-medium">All volumes</span>
          <span className="tw:text-xs tw:text-muted-foreground">{prettyBytes(totalSize)}</span>

          {volumes.length > 1 && (
            <Button variant="ghost" size="icon" className="tw:size-7" onClick={() => setExpanded((e) => !e)}>
              {expanded ? <ChevronUp className="tw:size-3.5" /> : <ChevronDown className="tw:size-3.5" />}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="tw:size-7 tw:text-destructive tw:hover:text-destructive"
            onClick={() => handleRemoveVolumes()}
            title="Remove all volumes"
          >
            <Trash2 className="tw:size-3.5" />
          </Button>
        </div>

        {expanded &&
          orderBy(volumes, ["size", "prettyName"], ["desc", "asc"]).map((vol) => (
            <div key={vol.name} className="tw:flex tw:items-center tw:gap-3 tw:py-2 tw:pl-6">
              <span className="tw:flex-1 tw:text-sm tw:truncate">{prettyDnpName(vol.prettyName)}</span>
              <span className="tw:text-xs tw:text-muted-foreground">
                {typeof vol.size === "number" ? prettyBytes(vol.size) : "–"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="tw:size-7 tw:text-destructive tw:hover:text-destructive"
                onClick={() => handleRemoveVolumes(vol.name)}
                title="Remove volume"
              >
                <Trash2 className="tw:size-3.5" />
              </Button>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}

/* ── Remove package card ────────────────────────────────────────────── */

function RemovePackageCard({ dnp }: { dnp: InstalledPackageDetailData }) {
  const navigate = useNavigate();
  const { dnpName, areThereVolumesToRemove, dependantsOf, notRemovable, manifest } = dnp;

  if (notRemovable) return null;

  async function handleRemove(deleteVolumes: boolean) {
    // On-remove warning from manifest
    const removeWarnings = manifest?.warnings?.onRemove;
    if (removeWarnings) {
      const ok = window.confirm(removeWarnings);
      if (!ok) return;
    }

    // Dependants warning
    if (dependantsOf.length > 0) {
      const depList = dependantsOf.map((d) => prettyDnpName(d)).join(", ");
      const ok = window.confirm(
        `Warning: ${depList} depend on ${prettyDnpName(dnpName)} and may stop working. Continue?`
      );
      if (!ok) return;
    }

    const prettyName = prettyDnpName(dnpName);
    try {
      toast.loading(`Removing ${prettyName}${deleteVolumes ? " and data" : ""}…`, { id: "pkg-rm" });
      await api.packageRemove({ dnpName, deleteVolumes });
      toast.success(`Removed ${prettyName}`, { id: "pkg-rm" });
      navigate("/ai/packages");
    } catch (e) {
      toast.error(`Failed: ${e}`, { id: "pkg-rm" });
    }
  }

  return (
    <Card className="tw:border-destructive/30">
      <CardContent className="tw:flex tw:items-center tw:justify-between tw:pt-4">
        <div>
          <p className="tw:text-sm tw:font-medium">Remove package</p>
          <p className="tw:text-xs tw:text-muted-foreground">Delete {prettyDnpName(dnpName)} permanently.</p>
        </div>
        <div className="tw:flex tw:gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="tw:size-3.5 tw:mr-1.5" />
                Remove
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="tw-base">
              <AlertDialogHeader>
                <AlertDialogTitle>Remove {prettyDnpName(dnpName)}</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                  {areThereVolumesToRemove &&
                    ` If you do NOT want to keep the package's data, choose "Remove and delete data".`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => handleRemove(false)}>
                  Remove
                </AlertDialogAction>
                {areThereVolumesToRemove && (
                  <AlertDialogAction variant="destructive" onClick={() => handleRemove(true)}>
                    Remove & delete data
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
