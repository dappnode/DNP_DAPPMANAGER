import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { api } from "api";
import { UserSettingsAllDnps, UserSettings, SetupWizard as SetupWizardType, PackageEnvs } from "@dappnode/types";
import { difference } from "utils/lodashExtended";
import { prettyDnpName } from "utils/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Input } from "components/primitives/input";
import { Label } from "components/primitives/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/primitives/select";
import { Switch } from "components/primitives/switch";
import { Separator } from "components/primitives/separator";
import { Settings, Save } from "lucide-react";

export function ConfigTab({
  dnpName,
  setupWizard,
  userSettings
}: {
  dnpName: string;
  setupWizard?: SetupWizardType;
  userSettings?: UserSettings;
}) {
  const [localUserSettings, setLocalUserSettings] = useState<UserSettingsAllDnps>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userSettings) setLocalUserSettings({ [dnpName]: userSettings });
  }, [userSettings, dnpName]);

  const currentEnvs = localUserSettings[dnpName]?.environment || {};
  const originalEnvs = userSettings?.environment || {};

  // Flatten env values to a single-service map for display
  const serviceNames = Object.keys(currentEnvs);

  // Determine if there are changes
  const hasChanges = useMemo(() => {
    try {
      return JSON.stringify(currentEnvs) !== JSON.stringify(originalEnvs);
    } catch {
      return false;
    }
  }, [currentEnvs, originalEnvs]);

  function updateEnv(service: string, key: string, value: string) {
    setLocalUserSettings((prev) => ({
      ...prev,
      [dnpName]: {
        ...prev[dnpName],
        environment: {
          ...prev[dnpName]?.environment,
          [service]: {
            ...(prev[dnpName]?.environment?.[service] || {}),
            [key]: value
          }
        }
      }
    }));
  }

  async function handleSubmit() {
    const newEnvs = localUserSettings[dnpName]?.environment;
    if (!newEnvs) return;

    const diffEnvs = difference(originalEnvs, newEnvs);

    // Build nice names from setup wizard fields
    const firstServiceEnvs: PackageEnvs = Object.values(diffEnvs)[0] || {};
    const niceNames = Object.keys(firstServiceEnvs).map((name) => {
      for (const field of setupWizard?.fields || []) {
        if (field.target?.type === "environment" && field.target.name === name) return field.title || name;
      }
      return name;
    });

    const envList = niceNames.join(", ");
    const prettyName = prettyDnpName(dnpName);

    try {
      setSubmitting(true);
      toast.loading(`Updating ${prettyName} ${envList}…`, { id: "config-update" });
      await api.packageSetEnvironment({ dnpName, environmentByService: diffEnvs });
      toast.success(`Updated ${prettyName} ${envList}`, { id: "config-update" });
    } catch (e) {
      toast.error(`Failed to update: ${e}`, { id: "config-update" });
    } finally {
      setSubmitting(false);
    }
  }

  // Build fields from setupWizard or fall back to raw env display
  const fields = setupWizard?.fields || [];

  // If we have setup wizard fields, render them nicely
  if (fields.length > 0) {
    return (
      <div className="tw:flex tw:flex-col tw:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="tw:flex tw:items-center tw:gap-2">
              <Settings className="tw:size-4" />
              Configuration
            </CardTitle>
            <CardDescription>Modify the environment variables for {prettyDnpName(dnpName)}.</CardDescription>
          </CardHeader>
          <CardContent className="tw:flex tw:flex-col tw:gap-5">
            {fields.map((field) => {
              const target = field.target;
              if (!target || target.type !== "environment") return null;

              const rawService = target.service;
              const service = Array.isArray(rawService) ? rawService[0] : rawService || serviceNames[0] || dnpName;
              const envKey = target.name;
              const value = currentEnvs[service]?.[envKey] ?? "";

              // Determine field type
              if (field.enum) {
                return (
                  <div key={`${service}-${envKey}`} className="tw:flex tw:flex-col tw:gap-2">
                    <Label>{field.title || envKey}</Label>
                    {field.description && <p className="tw:text-xs tw:text-muted-foreground">{field.description}</p>}
                    <Select value={value} onValueChange={(v: string) => updateEnv(service, envKey, v)}>
                      <SelectTrigger className="tw:w-full">
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent className="tw-base">
                        {field.enum.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }

              if (field.pattern === "^(true|false)$") {
                return (
                  <div key={`${service}-${envKey}`} className="tw:flex tw:items-center tw:justify-between tw:gap-3">
                    <div>
                      <Label>{field.title || envKey}</Label>
                      {field.description && (
                        <p className="tw:text-xs tw:text-muted-foreground tw:mt-0.5">{field.description}</p>
                      )}
                    </div>
                    <Switch
                      checked={value === "true" || value === "1"}
                      onCheckedChange={(checked: boolean) => updateEnv(service, envKey, checked ? "true" : "false")}
                    />
                  </div>
                );
              }

              return (
                <div key={`${service}-${envKey}`} className="tw:flex tw:flex-col tw:gap-2">
                  <Label>{field.title || envKey}</Label>
                  {field.description && <p className="tw:text-xs tw:text-muted-foreground">{field.description}</p>}
                  <Input
                    type={field.secret ? "password" : "text"}
                    placeholder=""
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEnv(service, envKey, e.target.value)}
                  />
                  {field.pattern && value && !new RegExp(field.pattern).test(value) && (
                    <p className="tw:text-xs tw:text-destructive">
                      {field.patternErrorMessage || `Must match pattern: ${field.pattern}`}
                    </p>
                  )}
                </div>
              );
            })}

            <Separator />
            <Button onClick={handleSubmit} disabled={!hasChanges || submitting} className="tw:self-start">
              <Save className="tw:size-3.5 tw:mr-1.5" />
              Update configuration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback: raw environment editor
  return (
    <div className="tw:flex tw:flex-col tw:gap-6">
      {serviceNames.map((service) => (
        <Card key={service}>
          <CardHeader>
            <CardTitle className="tw:flex tw:items-center tw:gap-2">
              <Settings className="tw:size-4" />
              {serviceNames.length > 1 ? `${service} – Environment` : "Environment Variables"}
            </CardTitle>
          </CardHeader>
          <CardContent className="tw:flex tw:flex-col tw:gap-4">
            {Object.entries(currentEnvs[service] || {}).map(([key, val]) => (
              <div key={key} className="tw:flex tw:flex-col tw:gap-1.5">
                <Label className="tw:font-mono tw:text-xs">{key}</Label>
                <Input value={val} onChange={(e) => updateEnv(service, key, e.target.value)} />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Button onClick={handleSubmit} disabled={!hasChanges || submitting} className="tw:self-start">
        <Save className="tw:size-3.5 tw:mr-1.5" />
        Update configuration
      </Button>
    </div>
  );
}
