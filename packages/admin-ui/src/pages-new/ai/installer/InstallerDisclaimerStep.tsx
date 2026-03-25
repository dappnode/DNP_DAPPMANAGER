import React from "react";
import RenderMarkdown from "components/RenderMarkdown";
import { Button } from "components/primitives/button";
import { Alert, AlertTitle, AlertDescription } from "components/primitives/alert";
import { ShieldAlert, CheckCircle, ArrowLeft } from "lucide-react";

interface InstallerDisclaimerStepProps {
  disclaimers: { name: string; message: string }[];
  onAccept: () => void;
  goBack: () => void;
}

/**
 * Disclaimer step — shows disclaimers from the package manifest
 * and/or a default "unverified" disclaimer.
 */
export function InstallerDisclaimerStep({ disclaimers, onAccept, goBack }: InstallerDisclaimerStepProps) {
  return (
    <div className="tw:flex tw:flex-col tw:gap-card">
      <div>
        <h2 className="tw:text-xl tw:font-semibold tw:text-foreground">Disclaimers</h2>
        <p className="tw:text-sm tw:text-muted-foreground tw:mt-1">
          Please review and accept the following before installing.
        </p>
      </div>

      {disclaimers.length === 0 ? (
        <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:text-success tw:py-4">
          <CheckCircle className="tw:size-4" />
          No special disclaimers required.
        </div>
      ) : (
        disclaimers.map((disclaimer) => (
          <Alert key={disclaimer.name}>
            <ShieldAlert className="tw:size-4" />
            <AlertTitle>{disclaimer.name}</AlertTitle>
            <AlertDescription>
              <RenderMarkdown source={disclaimer.message} />
            </AlertDescription>
          </Alert>
        ))
      )}

      <div className="tw:flex tw:items-center tw:justify-between tw:pt-2">
        <Button variant="ghost" onClick={goBack} className="tw:gap-1.5">
          <ArrowLeft className="tw:size-4" />
          Back
        </Button>
        <Button onClick={onAccept}>{disclaimers.length === 0 ? "Continue" : "Accept & Continue"}</Button>
      </div>
    </div>
  );
}
