import React, { useState, useEffect } from "react";
import { api } from "api";
import { toast } from "sonner";
import { DockerUpgradeRequirements } from "@dappnode/types";
import { lt } from "semver";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
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
import { CheckCircle2, XCircle, Loader2, HardDrive } from "lucide-react";

export function DockerUpgradeSection() {
  const [checkReq, setCheckReq] = useState<{
    loading?: boolean;
    result?: DockerUpgradeRequirements;
    error?: unknown;
  }>({});
  const [canUpdate, setCanUpdate] = useState(false);

  useEffect(() => {
    if (checkReq.result) {
      const {
        isDockerInUnattendedUpgrades,
        isDockerInstalledThroughApt,
        dockerHostVersion,
        dockerLatestVersion
      } = checkReq.result;
      setCanUpdate(
        !isDockerInUnattendedUpgrades ||
          !isDockerInstalledThroughApt ||
          Boolean(dockerLatestVersion && lt(dockerHostVersion, dockerLatestVersion))
      );
    }
  }, [checkReq.result]);

  async function dockerUpdateCheck() {
    try {
      setCheckReq({ loading: true });
      const requirements = await api.dockerUpgradeCheck();
      setCheckReq({ result: requirements });
    } catch (e) {
      setCheckReq({ error: e });
    }
  }

  const dockerCheckError = checkReq.error
    ? `Error checking Docker: ${checkReq.error instanceof Error ? checkReq.error.message : String(checkReq.error)}`
    : null;

  async function dockerUpdate() {
    try {
      toast.loading("Updating Docker...");
      await api.dockerUpgrade();
      toast.success("Docker updated successfully");
      await dockerUpdateCheck();
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">Docker</CardTitle>
        <CardDescription>Check Docker installation status and update if needed.</CardDescription>
      </CardHeader>
      <CardContent className="tw:space-y-4">
        <Button variant="outline" onClick={dockerUpdateCheck}>
          {checkReq.loading ? (
            <Loader2 className="tw:size-3.5 tw:animate-spin" />
          ) : (
            <HardDrive className="tw:size-3.5" />
          )}
          Check Docker Status
        </Button>

        {checkReq.result && (
          <div className="tw:space-y-2 tw:text-sm">
            <DockerCheckItem label="Docker in unattended upgrades" ok={checkReq.result.isDockerInUnattendedUpgrades} />
            <DockerCheckItem label="Docker installed through apt" ok={checkReq.result.isDockerInstalledThroughApt} />
            <DockerCheckItem
              label={`Docker version: ${checkReq.result.dockerHostVersion}`}
              ok={
                checkReq.result.isDockerInstalledThroughApt && checkReq.result.dockerLatestVersion
                  ? !lt(checkReq.result.dockerHostVersion, checkReq.result.dockerLatestVersion)
                  : undefined
              }
            />
          </div>
        )}

        {dockerCheckError && <p className="tw:text-sm tw:text-destructive">{dockerCheckError}</p>}

        {canUpdate && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button>Update Docker</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Docker update</AlertDialogTitle>
                <AlertDialogDescription>
                  Warning: the system may need to reboot. Make sure you can sustain some minutes of downtime.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={dockerUpdate}>Update</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}

function DockerCheckItem({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <div className="tw:flex tw:items-center tw:gap-2">
      {ok === undefined ? (
        <span className="tw:size-4" />
      ) : ok ? (
        <CheckCircle2 className="tw:size-4 tw:text-green-500 tw:shrink-0" />
      ) : (
        <XCircle className="tw:size-4 tw:text-destructive tw:shrink-0" />
      )}
      <span>{label}</span>
    </div>
  );
}
