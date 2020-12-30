import {
  RequestedDnp,
  SpecialPermissionAllDnps,
  UserSettingsAllDnps,
  SetupWizardAllDnps,
  CompatibleDnps
} from "../../common";
import { sampleRequestState } from "./sample";
import { MockDnp } from "./dnps/types";
import { mockDnps } from "./dnps";

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

    request: {
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
      }
    }
  };
}

export const dnpRequests = mockDnps.reduce(
  (obj, mockDnp) => ({
    ...obj,
    [mockDnp.metadata.name]: getRequestDnp(mockDnp)
  }),
  {} as { [dnpName: string]: RequestedDnp }
);
