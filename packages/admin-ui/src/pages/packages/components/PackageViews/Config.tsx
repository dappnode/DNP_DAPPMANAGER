import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import * as action from "../../actions";
import merge from "deepmerge";
// Components
import { SetupWizard } from "components/SetupWizard";
// Utils
import parseManifestEnvs from "pages/installer/parsers/parseManifestEnvs";
import parseInstalledDnpEnvs from "pages/installer/parsers/parseInstalledDnpEnvs";
import {
  PackageContainer,
  PackageEnvs,
  ManifestWithImage,
  UserSettingsAllDnps,
  PackageDetailData
} from "common/types";
import { EnvsVerbose } from "pages/installer/types";

function stringifyEnvs(envs: EnvsVerbose): PackageEnvs {
  const envsReduced: PackageEnvs = {};
  for (const { name, value } of Object.values(envs)) {
    envsReduced[name] = value;
  }
  return envsReduced;
}

export default function Config({
  dnp,
  dnpDetail
}: {
  dnp?: PackageContainer;
  dnpDetail?: PackageDetailData;
}) {
  const dispatch = useDispatch();
  const [envs, setEnvs] = useState<EnvsVerbose>({});

  const name = dnp ? dnp.name : "dnp";
  const environment = dnp ? dnp.envs : {};
  const setupWizardDnp = (dnpDetail || {}).setupWizard;
  const userSettingsDnp = (dnpDetail || {}).userSettings;
  const setupWizard = setupWizardDnp ? { [name]: setupWizardDnp } : {};
  const userSettings = userSettingsDnp ? { [name]: { environment } } : {};

  useEffect(() => {
    /**
     * Mix the ENVs from the manifest and the already set on the DNP
     * Also, convert to a nested object notation to retain the order
     * specified in the manifest
     * [NOTE] use deepmerge to preserve the `index` key comming from the manifest
     *
     * const envs = {
     *   "ENV_NAME": {
     *     name: "ENV_NAME",
     *     value: "ENV_VALUE",
     *     index: 0
     *   }
     * }
     */
    if (dnp)
      setEnvs(
        merge(
          parseManifestEnvs(dnp.manifest as ManifestWithImage | undefined),
          parseInstalledDnpEnvs(dnp)
        )
      );
  }, [dnp]);

  function onSubmit(newUserSettings: UserSettingsAllDnps) {
    if (!dnp || !dnp.name)
      return console.error(
        `Can't update ENVs because dnp.name not defined`,
        dnp
      );

    const newEnvs = newUserSettings[name].environment;
    if (newEnvs) {
      // Merge ENVs just in case the setupWizard does not return the full object
      dispatch(
        action.updatePackageEnv(dnp.name, merge(stringifyEnvs(envs), newEnvs))
      );
    }
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
