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

    const newEnvs = newUserSettings[id].environment;
    if (!newEnvs) return console.error(`SetupWizard returned no ENVs`);
    dispatch(packageSetEnvironment(id, newEnvs));
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
