import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { packageSetEnvironment } from "../actions";
// Components
import { SetupWizard } from "components/SetupWizard";
// Utils
import {
  SetupWizard as SetupWizardType,
  UserSettingsAllDnps,
  UserSettings
} from "types";
import { difference } from "utils/lodashExtended";

export default function Config({
  id,
  setupWizard,
  userSettings
}: {
  id: string;
  setupWizard?: SetupWizardType;
  userSettings?: UserSettings;
}) {
  const [localUserSettings, setLocalUserSettings] = useState<
    UserSettingsAllDnps
  >({});
  const dispatch = useDispatch();

  useEffect(() => {
    if (userSettings) setLocalUserSettings({ [id]: userSettings });
  }, [userSettings, id]);

  function onSubmit(newUserSettings: UserSettingsAllDnps) {
    // Persist them here so the new settings don't dissapear on submission
    setLocalUserSettings(newUserSettings);

    const prevEnvs = userSettings?.environment || {};
    const newEnvs = newUserSettings[id].environment;
    if (!newEnvs) return console.error(`SetupWizard returned no ENVs`);
    const diffEnvs = difference(prevEnvs, newEnvs);

    // Try to get a more friendly name for each ENV
    const niceNames = Object.keys(diffEnvs).map(name => {
      for (const field of setupWizard?.fields || [])
        if (field.target?.type === "environment" && field.target.name === name)
          return field.title || name;
      return name;
    });

    dispatch(packageSetEnvironment(id, diffEnvs, niceNames));
  }

  return (
    <SetupWizard
      setupWizard={setupWizard ? { [id]: setupWizard } : {}}
      userSettings={localUserSettings}
      onSubmit={onSubmit}
      submitTag="Update"
      disableIfEqual={true}
    />
  );
}
