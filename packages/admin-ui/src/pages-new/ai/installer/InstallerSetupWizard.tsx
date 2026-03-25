import React, { useState, useEffect, useCallback } from "react";
import deepmerge from "deepmerge";
import { isEmpty } from "lodash-es";
import ReactMarkdown from "react-markdown";
import { SetupWizardField, UserSettingsAllDnps, SetupWizardAllDnps } from "@dappnode/types";
import { prettyDnpName } from "utils/format";
import { isSecret } from "utils/isSecret";
import {
  formDataToUserSettings,
  userSettingsToFormData,
  setupWizardToSetupTarget,
  filterActiveSetupWizard,
  isSetupWizardEmpty
} from "pages/installer/parsers/formDataParser";
import { parseSetupWizardErrors, SetupWizardError } from "pages/installer/parsers/formDataErrors";
import { SetupWizardFormDataReturn } from "pages/installer/types";
import { Button } from "components/primitives/button";
import { Input } from "components/primitives/input";
import { Label } from "components/primitives/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/primitives/select";
import { Switch } from "components/primitives/switch";
import { Card, CardContent } from "components/primitives/card";
import { Alert, AlertDescription } from "components/primitives/alert";
import { ArrowLeft, Eye, EyeOff, Upload, TriangleAlert } from "lucide-react";

/* ── Sub-components ─────────────────────────────────────────────────── */
function SetupField({
  field,
  value,
  onValueChange,
  error
}: {
  field: SetupWizardField;
  value: string;
  onValueChange: (newValue: string) => void;
  error?: SetupWizardError;
}) {
  const [showSecret, setShowSecret] = useState(false);

  const isSecretField =
    field.secret !== undefined
      ? field.secret
      : isSecret(field.id) ||
        Boolean(field.target && field.target.type === "environment" && isSecret(field.target.name));

  const isFileUpload = field.target?.type === "fileUpload";
  const isEnum = Boolean(field.enum);

  return (
    <div className="tw:flex tw:flex-col tw:gap-1.5">
      <Label htmlFor={field.id} className="tw:text-sm tw:font-medium">
        {field.title}
        {field.required && <span className="tw:text-destructive tw:ml-0.5">*</span>}
      </Label>

      {field.description && (
        <div className="tw:text-sm tw:text-muted-foreground tw:[&_a]:underline tw:[&_a]:underline-offset-2 tw:[&_p]:m-0">
          <ReactMarkdown linkTarget="_blank">{field.description}</ReactMarkdown>
        </div>
      )}

      {isEnum ? (
        <Select value={value || undefined} onValueChange={onValueChange}>
          <SelectTrigger className="tw:w-full">
            <SelectValue placeholder="Select a value" />
          </SelectTrigger>
          <SelectContent>
            {field.enum!.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : isFileUpload ? (
        <FileUploadField value={value} onValueChange={onValueChange} />
      ) : isSecretField ? (
        <div className="tw:relative">
          <Input
            id={field.id}
            type={showSecret ? "text" : "password"}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder={field.title}
            className="tw:pr-10"
          />
          <button
            type="button"
            onClick={() => setShowSecret((x) => !x)}
            className="tw:absolute tw:right-2 tw:top-1/2 tw:-translate-y-1/2 tw:bg-transparent tw:text-muted-foreground tw:hover:text-foreground"
          >
            {showSecret ? <EyeOff className="tw:size-4" /> : <Eye className="tw:size-4" />}
          </button>
        </div>
      ) : (
        <Input
          id={field.id}
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={field.title}
          aria-invalid={!!error}
        />
      )}

      {error && <p className="tw:text-sm tw:text-destructive">{error.message}</p>}
    </div>
  );
}

/** File upload field with drag-and-drop visual hint */
function FileUploadField({ value, onValueChange }: { value: string; onValueChange: (v: string) => void }) {
  const [processing, setProcessing] = useState(false);

  async function onSelectFile(files: FileList) {
    try {
      setProcessing(true);
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataURL = event.target.result
            .toString()
            .replace(";base64", `;name=${encodeURIComponent(file.name)};base64`);
          onValueChange(dataURL);
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error("Error processing file:", e);
    } finally {
      setProcessing(false);
    }
  }

  const fileName = value ? decodeFileName(value) : null;

  return (
    <label className="tw:flex tw:items-center tw:gap-2 tw:rounded-lg tw:border tw:border-dashed tw:border-input tw:bg-muted/30 tw:px-3 tw:py-2.5 tw:cursor-pointer tw:hover:bg-muted/50 tw:transition-colors">
      <Upload className="tw:size-4 tw:shrink-0 tw:text-muted-foreground" />
      <span className="tw:text-sm tw:text-muted-foreground tw:truncate">
        {processing ? "Loading file…" : fileName ?? "Choose file"}
      </span>
      <input type="file" className="tw:sr-only" onChange={(e) => e.target.files && onSelectFile(e.target.files)} />
    </label>
  );
}

/** Extract the file name from a data URL */
function decodeFileName(dataURL: string): string | null {
  const match = dataURL.match(/;name=([^;]+);/);
  if (match) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return null;
}

/* ── Advanced editor ────────────────────────────────────────────────── */

function AdvancedEditor({
  userSettings,
  onChange
}: {
  userSettings: UserSettingsAllDnps;
  onChange: (newUserSettings: UserSettingsAllDnps) => void;
}) {
  return (
    <div className="tw:flex tw:flex-col tw:gap-6">
      {Object.entries(userSettings).map(([dnpName, dnpSettings]) => (
        <div key={dnpName} className="tw:flex tw:flex-col tw:gap-4">
          <h3 className="tw:text-base tw:font-semibold tw:text-foreground">{prettyDnpName(dnpName)}</h3>

          {/* Environment variables */}
          {dnpSettings.environment &&
            Object.entries(dnpSettings.environment).map(([serviceName, environment]) => (
              <div key={serviceName} className="tw:flex tw:flex-col tw:gap-2">
                <span className="tw:text-sm tw:font-medium tw:text-muted-foreground">{prettyDnpName(serviceName)}</span>
                {Object.entries(environment || {}).map(([envName, envValue]) => (
                  <div key={envName} className="tw:grid tw:grid-cols-[1fr_1fr] tw:gap-2 tw:items-center">
                    <Input value={envName} readOnly className="tw:bg-muted/50 tw:text-muted-foreground" />
                    <Input
                      value={envValue ?? ""}
                      placeholder="enter value…"
                      onChange={(e) =>
                        onChange({
                          [dnpName]: {
                            environment: { [serviceName]: { [envName]: e.target.value } }
                          }
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            ))}

          {/* Port mappings */}
          {dnpSettings.portMappings &&
            Object.entries(dnpSettings.portMappings).map(([serviceName, portMappings]) => (
              <div key={serviceName} className="tw:flex tw:flex-col tw:gap-2">
                <span className="tw:text-sm tw:font-medium tw:text-muted-foreground">
                  {prettyDnpName(serviceName)} — Ports
                </span>
                {Object.entries(portMappings || {}).map(([containerPort, hostPort]) => (
                  <div key={containerPort} className="tw:grid tw:grid-cols-[1fr_1fr] tw:gap-2 tw:items-center">
                    <Input value={containerPort} readOnly className="tw:bg-muted/50 tw:text-muted-foreground" />
                    <Input
                      value={hostPort ?? ""}
                      placeholder="Ephemeral port if unspecified"
                      onChange={(e) =>
                        onChange({
                          [dnpName]: {
                            portMappings: { [serviceName]: { [containerPort]: e.target.value } }
                          }
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            ))}

          {/* Named volume mountpoints */}
          {dnpSettings.namedVolumeMountpoints && !isEmpty(dnpSettings.namedVolumeMountpoints) && (
            <div className="tw:flex tw:flex-col tw:gap-2">
              <span className="tw:text-sm tw:font-medium tw:text-muted-foreground">Volume Mountpoints</span>
              {Object.entries(dnpSettings.namedVolumeMountpoints).map(([volName, mountpoint]) => (
                <div key={volName} className="tw:grid tw:grid-cols-[1fr_1fr] tw:gap-2 tw:items-center">
                  <Input value={volName} readOnly className="tw:bg-muted/50 tw:text-muted-foreground" />
                  <Input
                    value={mountpoint ?? ""}
                    placeholder="default docker location if unspecified"
                    onChange={(e) =>
                      onChange({
                        [dnpName]: {
                          namedVolumeMountpoints: { [volName]: e.target.value }
                        }
                      })
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────── */

interface InstallerSetupWizardProps {
  setupWizard: SetupWizardAllDnps;
  userSettings: UserSettingsAllDnps;
  onSubmit: (newUserSettings: UserSettingsAllDnps) => void;
  goBack: () => void;
}

export function InstallerSetupWizard({
  setupWizard,
  userSettings: initialUserSettings,
  onSubmit,
  goBack
}: InstallerSetupWizardProps) {
  const isWizardEmpty = isSetupWizardEmpty(setupWizard);
  const [showAdvanced, setShowAdvanced] = useState(isWizardEmpty);
  const [submitting, setSubmitting] = useState(false);
  const [userSettings, setUserSettings] = useState(initialUserSettings);

  useEffect(() => {
    setUserSettings(initialUserSettings);
  }, [initialUserSettings]);

  useEffect(() => {
    setShowAdvanced(isWizardEmpty);
  }, [isWizardEmpty]);

  // Derived data for the visual wizard
  const setupTarget = setupWizardToSetupTarget(setupWizard);
  const formData = userSettingsToFormData(userSettings, setupTarget);
  const setupWizardActive = filterActiveSetupWizard(setupWizard, formData);
  const dataErrors = parseSetupWizardErrors(setupWizardActive, formData);
  const visibleDataErrors = dataErrors.filter((error) => submitting || error.type !== "empty");

  const onNewUserSettings = useCallback((newUserSettings: UserSettingsAllDnps) => {
    setSubmitting(false);
    setUserSettings((prev) => deepmerge(prev, newUserSettings));
  }, []);

  function onNewFormData(newFormData: SetupWizardFormDataReturn) {
    onNewUserSettings(formDataToUserSettings(newFormData, setupTarget));
  }

  function handleSubmit() {
    if (dataErrors.length) {
      setSubmitting(true);
    } else {
      onSubmit(userSettings);
    }
  }

  return (
    <div className="tw:flex tw:flex-col tw:gap-card">
      {/* Header */}
      <div>
        <h2 className="tw:text-xl tw:font-semibold tw:text-foreground">Configuration</h2>
        <p className="tw:text-sm tw:text-muted-foreground tw:mt-1">
          {showAdvanced
            ? "Edit raw environment variables, ports & volumes."
            : "Configure the package before installing."}
        </p>
      </div>

      {/* Editor card */}
      <Card>
        <CardContent className="tw:flex tw:flex-col tw:gap-6 tw:pt-4">
          {showAdvanced ? (
            <AdvancedEditor userSettings={userSettings} onChange={onNewUserSettings} />
          ) : (
            /* Visual wizard */
            <div className="tw:flex tw:flex-col tw:gap-8">
              {Object.entries(setupWizardActive).map(([dnpName, setupWizardDnp]) => (
                <div key={dnpName} className="tw:flex tw:flex-col tw:gap-5">
                  <h3 className="tw:text-base tw:font-semibold tw:text-foreground">{prettyDnpName(dnpName)}</h3>
                  {setupWizardDnp.fields.map((field) => {
                    const fieldError = visibleDataErrors.find((e) => e.dnpName === dnpName && e.id === field.id);
                    return (
                      <SetupField
                        key={field.id}
                        field={field}
                        value={(formData[dnpName] || {})[field.id] || ""}
                        onValueChange={(newValue) => onNewFormData({ [dnpName]: { [field.id]: newValue } })}
                        error={fieldError}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Validation errors summary */}
          {visibleDataErrors.length > 0 && (
            <Alert variant="destructive">
              <TriangleAlert className="tw:size-4" />
              <AlertDescription>
                {visibleDataErrors.map(({ dnpName, id, title, type, message }) => (
                  <div key={dnpName + id + type} className="tw:text-sm">
                    <strong>{prettyDnpName(dnpName)}</strong> — {title}: {message}
                  </div>
                ))}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Bottom bar */}
      <div className="tw:flex tw:items-center tw:justify-between tw:pt-2">
        <div className="tw:flex tw:items-center tw:gap-4">
          <Button variant="ghost" onClick={goBack} className="tw:gap-1.5">
            <ArrowLeft className="tw:size-4" />
            Back
          </Button>

          {/* Advanced toggle — only show if the wizard is not empty */}
          {!isWizardEmpty && (
            <div className="tw:flex tw:items-center tw:gap-2">
              <Switch id="advanced-toggle" checked={showAdvanced} onCheckedChange={setShowAdvanced} />
              <Label htmlFor="advanced-toggle" className="tw:text-sm tw:text-muted-foreground tw:cursor-pointer">
                Advanced editor
              </Label>
            </div>
          )}
        </div>

        <Button onClick={handleSubmit}>Submit &amp; Continue</Button>
      </div>
    </div>
  );
}
