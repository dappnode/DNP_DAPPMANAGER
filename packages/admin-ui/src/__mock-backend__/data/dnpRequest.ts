import {
  RequestedDnp,
  SpecialPermissionAllDnps,
  UserSettingsAllDnps,
  SetupWizardAllDnps,
  CompatibleDnps
} from "@dappnode/common";
import { sampleRequestState } from "./sample";
import { MockDnp } from "./dnps/types";
import { mockDnps } from "./dnps";
import { mapValues } from "lodash-es";

function getRequestDnp(dnp: MockDnp): RequestedDnp {
  const settings: UserSettingsAllDnps = {};
  const setupWizard: SetupWizardAllDnps = {};
  const specialPermissions: SpecialPermissionAllDnps = {};
  const compatibleDnps: CompatibleDnps = {};

  for (const dep of [dnp, ...(dnp.dependencies || [])]) {
    const dnpName = dep.metadata.name;
    if (dep.userSettings) settings[dnpName] = dep.userSettings;
    if (dep.setupWizard) setupWizard[dnpName] = dep.setupWizard;
    if (dep.specialPermissions)
      specialPermissions[dnpName] = dep.specialPermissions;
    compatibleDnps[dnpName] = {
      from: dep.installedData?.version,
      to: dep.metadata.version
    };
  }

  return {
    ...sampleRequestState,
    dnpName: dnp.metadata.name,
    reqVersion: dnp.metadata.version,
    semVersion: dnp.metadata.version,
    avatarUrl: dnp.avatar || "",
    metadata: dnp.metadata,

    imageSize: 19872630,
    isUpdated: false,
    isInstalled: Boolean(dnp.installedData),

    settings,
    setupWizard,
    specialPermissions,

    compatible: {
      requiresCoreUpdate: false,
      resolving: false,
      isCompatible: true,
      error: "",
      dnps: compatibleDnps
    },
    available: {
      isAvailable: true,
      message: ""
    },

    signedSafe: mapValues(compatibleDnps, () => ({
      safe: true,
      message: "Signed by known key 0xf35960302a07022aba880dffaec2fdd64d5bf1c1"
    })),
    signedSafeAll: true,
    ...dnp.requestDnp
  };
}

export const dnpRequests = mockDnps.reduce(
  (obj, mockDnp) => ({
    ...obj,
    [mockDnp.metadata.name]: getRequestDnp(mockDnp)
  }),
  {} as { [dnpName: string]: RequestedDnp }
);
