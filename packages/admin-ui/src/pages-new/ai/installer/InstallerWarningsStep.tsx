import React from "react";
import { Manifest, RequestedDnp } from "@dappnode/types";
import { ReleaseType } from "semver";
import RenderMarkdown from "components/RenderMarkdown";
import { Card, CardContent } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Alert, AlertTitle, AlertDescription } from "components/primitives/alert";
import { TriangleAlert, ArrowLeft } from "lucide-react";

interface InstallerWarningsStepProps {
  goNext: () => void;
  goBack: () => void;
  warnings: Manifest["warnings"];
  isInstalled: RequestedDnp["isInstalled"];
  updateType?: ReleaseType | null | "";
}

/**
 * Warnings step — shows contextual warnings for the current install/update.
 */
export function InstallerWarningsStep({
  goNext,
  goBack,
  warnings,
  isInstalled,
  updateType
}: InstallerWarningsStepProps) {
  if (!warnings) {
    return (
      <div className="tw:flex tw:flex-col tw:gap-card">
        <Card>
          <CardContent className="tw:py-8 tw:text-center tw:text-sm tw:text-muted-foreground">
            No warnings to display.
          </CardContent>
        </Card>
        <div className="tw:flex tw:items-center tw:justify-between">
          <Button variant="ghost" onClick={goBack} className="tw:gap-1.5">
            <ArrowLeft className="tw:size-4" />
            Back
          </Button>
          <Button onClick={goNext}>Continue</Button>
        </div>
      </div>
    );
  }

  let warningTitle = "";
  let warningContent = "";

  if (isInstalled && warnings.onInstall) {
    warningTitle = "Installation Warning";
    warningContent = warnings.onInstall;
  } else if (updateType === "patch" && warnings.onPatchUpdate) {
    warningTitle = "Patch Update Warning";
    warningContent = warnings.onPatchUpdate;
  } else if (updateType === "minor" && warnings.onMinorUpdate) {
    warningTitle = "Minor Update Warning";
    warningContent = warnings.onMinorUpdate;
  } else if (updateType === "major" && warnings.onMajorUpdate) {
    warningTitle = "Major Update Warning";
    warningContent = warnings.onMajorUpdate;
  }

  return (
    <div className="tw:flex tw:flex-col tw:gap-card">
      <div>
        <h2 className="tw:text-xl tw:font-semibold tw:text-foreground">Warnings</h2>
        <p className="tw:text-sm tw:text-muted-foreground tw:mt-1">
          Please review the following warnings before continuing.
        </p>
      </div>

      {warningContent && (
        <Alert>
          <TriangleAlert className="tw:size-4" />
          <AlertTitle>{warningTitle}</AlertTitle>
          <AlertDescription>
            <RenderMarkdown source={warningContent} />
          </AlertDescription>
        </Alert>
      )}

      <div className="tw:flex tw:items-center tw:justify-between tw:pt-2">
        <Button variant="ghost" onClick={goBack} className="tw:gap-1.5">
          <ArrowLeft className="tw:size-4" />
          Back
        </Button>
        <Button onClick={goNext}>Continue</Button>
      </div>
    </div>
  );
}
