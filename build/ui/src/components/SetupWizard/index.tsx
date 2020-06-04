import React, { useState, useEffect } from "react";
import deepmerge from "deepmerge";
// Components
import Card from "components/Card";
import Alert from "react-bootstrap/Alert";
import { UserSettingsAllDnps, SetupWizardAllDnps } from "types";
import { shortNameCapitalized } from "utils/format";
import { EditorAdvanced } from "./EditorAdvanced";
import { EditorV2 } from "./EditorV2";
import {
  formDataToUserSettings,
  userSettingsToFormData,
  setupWizardToSetupTarget,
  filterActiveSetupWizard,
  isSetupWizardEmpty
} from "pages/installer/parsers/formDataParser";
import Button from "components/Button";
import { parseSetupWizardErrors } from "pages/installer/parsers/formDataErrors";
import { SetupWizardFormDataReturn } from "pages/installer/types";
import "./setupWizard.scss";

export function SetupWizard({
  setupWizard,
  userSettings: initialUserSettings,
  onSubmit,
  goBack,
  submitTag
}: {
  setupWizard: SetupWizardAllDnps;
  userSettings: UserSettingsAllDnps;
  onSubmit: (newUserSettings: UserSettingsAllDnps) => void;
  goBack?: () => void;
  submitTag?: string;
}) {
  const isWizardEmpty = isSetupWizardEmpty(setupWizard);
  const [showAdvanced, setShowAdvanced] = useState(isWizardEmpty);
  const [submitting, setSubmitting] = useState(false);
  const [userSettings, setUserSettings] = useState(initialUserSettings);

  useEffect(() => {
    setUserSettings(initialUserSettings);
  }, [initialUserSettings]);

  // Automatically show advanced if wizard is empty
  useEffect(() => {
    setShowAdvanced(isWizardEmpty);
  }, [isWizardEmpty]);

  // New editor data
  const setupTarget = setupWizardToSetupTarget(setupWizard);
  const formData = userSettingsToFormData(userSettings, setupTarget);
  const setupWizardActive = filterActiveSetupWizard(setupWizard, formData);
  const dataErrors = parseSetupWizardErrors(setupWizardActive, formData);
  const visibleDataErrors = dataErrors.filter(
    error => submitting || error.type !== "empty"
  );

  /**
   * Merge instead of setting a new value to:
   * - Preserve the info about all available fields, NewEditor may ignore fields
   * - Allows to memo this function, which improves performance for expensive
   *   components (SelectMountpoint)
   *   NOTE: Didn't fix the problem, but the slow down is not that bad
   * @param newUserSettings Will be partial newUserSettings
   */
  function onNewUserSettings(newUserSettings: UserSettingsAllDnps) {
    setSubmitting(false);
    setUserSettings(prevUserSettings =>
      deepmerge(prevUserSettings, newUserSettings)
    );
  }

  /**
   * Convert the Editor's formData object to a userSettings given a setupTarget
   */
  function onNewFormData(newFormData: SetupWizardFormDataReturn) {
    const newUserSettings = formDataToUserSettings(newFormData, setupTarget);
    onNewUserSettings(newUserSettings);
  }

  /**
   * On submit show the "empty" type errors if any by switching to `submitting` mode
   * Otherwise, submit the current userSettings
   */
  function handleSubmit() {
    if (dataErrors.length) setSubmitting(true);
    else onSubmit(userSettings);
  }

  return (
    <Card spacing noscroll className="setup-wizard">
      {showAdvanced ? (
        <EditorAdvanced
          userSettings={userSettings}
          onChange={onNewUserSettings}
        />
      ) : (
        <EditorV2
          formData={formData}
          errors={visibleDataErrors}
          setupWizard={setupWizardActive}
          onNewFormData={onNewFormData}
        />
      )}

      {visibleDataErrors.length > 0 && (
        <Alert variant="danger">
          {visibleDataErrors.map(({ dnpName, id, title, type, message }) => (
            <div key={dnpName + id + type}>
              {shortNameCapitalized(dnpName)} - {title} - {message}
            </div>
          ))}
        </Alert>
      )}

      <div className="bottom-buttons">
        <div>
          {goBack && <Button onClick={goBack}>Cancel</Button>}
          <Button onClick={handleSubmit} variant="dappnode">
            {submitTag || "Submit"}
          </Button>
        </div>
        {/* Only allow to toggle between editors if the setup wizard is available */}
        {!isWizardEmpty && (
          <div
            className="subtle-header"
            onClick={() => setShowAdvanced(x => !x)}
          >
            {showAdvanced ? "Hide" : "Show"} advanced editor
          </div>
        )}
      </div>
    </Card>
  );
}
