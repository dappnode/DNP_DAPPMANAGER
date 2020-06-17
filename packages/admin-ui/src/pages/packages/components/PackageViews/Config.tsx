import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import * as action from "../../actions";
// Components
import { SetupWizard } from "components/SetupWizard";
// Utils
import {
  PackageContainer,
  UserSettingsAllDnps,
  PackageDetailData
} from "common/types";

export default function Config({
  dnp,
  dnpDetail
}: {
  dnp?: PackageContainer;
  dnpDetail?: PackageDetailData;
}) {
  const [userSettings, setUserSettings] = useState<UserSettingsAllDnps>({});
  const dispatch = useDispatch();

  const name = dnp ? dnp.name : "dnp";
  const setupWizardDnp = (dnpDetail || {}).setupWizard;
  const setupWizard = setupWizardDnp ? { [name]: setupWizardDnp } : {};

  useEffect(() => {
    const userSettingsDnp = (dnpDetail || {}).userSettings;
    if (userSettingsDnp) setUserSettings({ [name]: userSettingsDnp });
  }, [dnpDetail, name]);

  function onSubmit(newUserSettings: UserSettingsAllDnps) {
    // Persist them here so the new settings don't dissapear on submission
    setUserSettings(newUserSettings);

    if (!dnp || !dnp.name)
      return console.error(
        `Can't update ENVs because dnp.name not defined`,
        dnp
      );

    const newEnvs = newUserSettings[name].environment;
    if (!newEnvs) return console.error(`SetupWizard returned no ENVs`);
    dispatch(action.updatePackageEnv(dnp.name, newEnvs));
  }

  return (
    <SetupWizard
      setupWizard={setupWizard}
      userSettings={userSettings}
      onSubmit={onSubmit}
      submitTag="Update"
    />
  );
}
