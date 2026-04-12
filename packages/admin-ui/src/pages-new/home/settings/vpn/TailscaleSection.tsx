import React, { useState, useEffect } from "react";
import { api, useApi } from "api";
import { toast } from "sonner";
import { tailscaleDnpName, docsUrl } from "params";
import { prettyDnpName } from "utils/format";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Skeleton } from "components/primitives/skeleton";
import { Alert, AlertDescription } from "components/primitives/alert";
import { Info, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UserSettingsAllDnps, UserSettings, PackageEnvs, SetupWizard as SetupWizardType } from "@dappnode/types";
import { SetupWizard } from "components/SetupWizard";
import { difference } from "utils/lodashExtended";

export function TailscaleSection() {
  const navigate = useNavigate();
  const dnpRequest = useApi.packageGet({ dnpName: tailscaleDnpName });
  const dnp = dnpRequest.data;

  // Loading
  if (dnpRequest.isValidating && !dnp) {
    return (
      <div className="tw:space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("..")}>
          <ArrowLeft className="tw:size-3.5" />
          Back to VPN
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="tw:text-base">Tailscale</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="tw:h-32 tw:w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not installed
  if (!dnp) {
    const notFound = dnpRequest.error?.message?.includes("No DNP was found");
    return (
      <div className="tw:space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("..")}>
          <ArrowLeft className="tw:size-3.5" />
          Back to VPN
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="tw:text-base">Tailscale</CardTitle>
          </CardHeader>
          <CardContent>
            {notFound ? (
              <Alert>
                <Info className="tw:size-4" />
                <AlertDescription>
                  {prettyDnpName(tailscaleDnpName)} is not installed. Install it from the Packages section.
                </AlertDescription>
              </Alert>
            ) : (
              <p className="tw:text-sm tw:text-destructive">
                {dnpRequest.error?.message || "Error loading Tailscale package"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="tw:space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("..")}>
        <ArrowLeft className="tw:size-3.5" />
        Back to VPN
      </Button>
      <TailscaleConfig dnp={dnp} />
    </div>
  );
}

/* ── Tailscale Config (SetupWizard) ─────────────────────────────────── */

function TailscaleConfig({
  dnp
}: {
  dnp: { dnpName: string; userSettings?: UserSettings; setupWizard?: SetupWizardType };
}) {
  const [localUserSettings, setLocalUserSettings] = useState<UserSettingsAllDnps>({});

  useEffect(() => {
    if (dnp.userSettings) setLocalUserSettings({ [dnp.dnpName]: dnp.userSettings });
  }, [dnp.userSettings, dnp.dnpName]);

  function onSubmit(newUserSettings: UserSettingsAllDnps) {
    setLocalUserSettings(newUserSettings);

    const prevEnvs = dnp.userSettings?.environment || {};
    const newEnvs = newUserSettings[dnp.dnpName].environment;
    if (!newEnvs) return console.error("SetupWizard returned no ENVs");
    const diffEnvs = difference(prevEnvs, newEnvs);

    const serviceEnvs: PackageEnvs = Object.values(diffEnvs)[0];
    const niceNames = Object.keys(serviceEnvs).map((name) => {
      for (const field of dnp.setupWizard?.fields || [])
        if (field.target?.type === "environment" && field.target.name === name) return field.title || name;
      return name;
    });

    const envByService: Record<string, Record<string, string>> = {};
    for (const [service, envs] of Object.entries(diffEnvs)) {
      envByService[service] = envs;
    }

    toast.promise(
      api.packageSetEnvironment({
        dnpName: dnp.dnpName,
        environmentByService: envByService
      }),
      {
        loading: `Updating ${niceNames.join(", ")}...`,
        success: "Tailscale configuration updated",
        error: (e) => `Error: ${e instanceof Error ? e.message : String(e)}`
      }
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">Tailscale Configuration</CardTitle>
        <CardDescription>
          Configure your Tailscale VPN connection.{" "}
          <a
            href={docsUrl.tailscaleVpn}
            target="_blank"
            rel="noopener noreferrer"
            className="tw:underline tw:text-primary"
          >
            Setup guide
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="legacy-bootstrap">
          <SetupWizard
            setupWizard={dnp.setupWizard ? { [dnp.dnpName]: dnp.setupWizard } : {}}
            userSettings={localUserSettings}
            onSubmit={onSubmit}
            submitTag="Update"
            disableIfEqual={true}
          />
        </div>
      </CardContent>
    </Card>
  );
}
