import React, { useState } from "react";
import { api } from "api";
import { toast } from "sonner";
import { InstalledPackageData, PackageContainer } from "@dappnode/types";
import { Card, CardContent, CardHeader, CardTitle } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Badge } from "components/primitives/badge";
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
import { prettyDnpName, prettyFullName } from "utils/format";
import { continueIfCalleDisconnected } from "api/utils";
import { wifiDnpName } from "@/params";
import { RefreshCw, Pause, Play, ChevronDown, ChevronUp } from "lucide-react";

export const stateColors: Record<SimpleState, string> = {
  running: "tw:text-green-600 tw:dark:text-green-400",
  stopped: "tw:text-muted-foreground",
  crashed: "tw:text-destructive",
  restarting: "tw:text-amber-500",
  removing: "tw:text-muted-foreground"
};

export function ContainersCard({ dnp }: { dnp: InstalledPackageData }) {
  const [expanded, setExpanded] = useState(false);
  const multiService = dnp.containers.length > 1;
  const allRunning = dnp.containers.every((c) => c.running);
  const isWifi = dnp.dnpName === wifiDnpName;

  async function doRestart(container?: PackageContainer) {
    const serviceNames = container ? [container.serviceName] : undefined;
    const name = container ? prettyFullName(container) : prettyDnpName(dnp.dnpName);
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

  async function doStartStop(container?: PackageContainer) {
    const serviceNames = container ? [container.serviceName] : undefined;
    const name = container ? prettyFullName(container) : prettyDnpName(dnp.dnpName);
    try {
      toast.loading(`Toggling ${name}…`, { id: `toggle-${name}` });
      await api.packageStartStop({ dnpName: dnp.dnpName, serviceNames });
      toast.success(`Toggled ${name}`, { id: `toggle-${name}` });
    } catch (e) {
      toast.error(`Failed: ${e}`, { id: `toggle-${name}` });
    }
  }

  function RestartButton({ container, showName }: { container?: PackageContainer; showName: string }) {
    const needsConfirm = container ? container.running : dnp.containers.some((c) => c.running);

    if (!needsConfirm) {
      return (
        <Button variant="ghost" size="icon" className="tw:size-7" onClick={() => doRestart(container)} title="Restart">
          <RefreshCw className="tw:size-3.5" />
        </Button>
      );
    }

    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="tw:size-7" title="Restart">
            <RefreshCw className="tw:size-3.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="tw-base">
          <AlertDialogHeader>
            <AlertDialogTitle>Restart {showName}</AlertDialogTitle>
            <AlertDialogDescription>
              If this package holds state it may be lost. Are you sure you want to restart?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => doRestart(container)}>Restart</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  function StartStopButton({ container, showName }: { container?: PackageContainer; showName: string }) {
    const running = container ? container.running : allRunning;

    if (!isWifi) {
      return (
        <Button
          variant="ghost"
          size="icon"
          className="tw:size-7"
          onClick={() => doStartStop(container)}
          title={running ? "Pause" : "Start"}
        >
          {running ? <Pause className="tw:size-3.5" /> : <Play className="tw:size-3.5" />}
        </Button>
      );
    }

    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="tw:size-7" title={running ? "Pause" : "Start"}>
            {running ? <Pause className="tw:size-3.5" /> : <Play className="tw:size-3.5" />}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="tw-base">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {running ? "Stop" : "Start"} {showName}
            </AlertDialogTitle>
            <AlertDialogDescription>
              If you are connected via WiFi you will lose access. Make sure you have another way to connect before
              proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => doStartStop(container)}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  function ContainerRow({ container, showName }: { container?: PackageContainer; showName: string }) {
    const state = container
      ? parseContainerState(container)
      : { state: allRunning ? ("running" as SimpleState) : ("stopped" as SimpleState) };

    return (
      <div className="tw:flex tw:items-center tw:gap-3 tw:py-2">
        <Badge variant="outline" className={`tw:capitalize tw:text-xs tw:font-medium ${stateColors[state.state]}`}>
          {state.state}
        </Badge>
        <span className="tw:flex-1 tw:text-sm tw:font-medium tw:truncate">{showName}</span>
        <StartStopButton container={container} showName={showName} />
        <RestartButton container={container} showName={showName} />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Containers</CardTitle>
      </CardHeader>
      <CardContent className="tw:flex tw:flex-col tw:divide-y tw:divide-border">
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

          <StartStopButton showName={multiService ? "All containers" : prettyDnpName(dnp.dnpName)} />
          <RestartButton showName={multiService ? "All containers" : prettyDnpName(dnp.dnpName)} />
        </div>

        {expanded &&
          dnp.containers.map((c) => (
            <ContainerRow key={c.serviceName} container={c} showName={prettyDnpName(c.serviceName)} />
          ))}
      </CardContent>
    </Card>
  );
}
