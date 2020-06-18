import {
  RequestedDnp,
  SpecialPermissionAllDnps,
  UserSettingsAllDnps,
  SetupWizardAllDnps,
  CompatibleDnps
} from "../../src/common";
import { sampleRequestState } from "./sample";
import { MockDnp } from "./dnps/types";
import { mockDnps } from "./dnps";

function getRequestDnp(dnp: MockDnp): RequestedDnp {
  const settings: UserSettingsAllDnps = {};
  const setupWizard: SetupWizardAllDnps = {};
  const specialPermissions: SpecialPermissionAllDnps = {};
  const compatibleDnps: CompatibleDnps = {};

  for (const dep of [dnp, ...(dnp.dependencies || [])]) {
    const name = dep.metadata.name;
    if (dep.userSettings) settings[name] = dep.userSettings;
    if (dep.setupWizard) setupWizard[name] = dep.setupWizard;
    if (dep.specialPermissions)
      specialPermissions[name] = dep.specialPermissions;
    compatibleDnps[name] = {
      from: dep.installedData?.version,
      to: dep.metadata.version
    };
  }

  return {
    ...sampleRequestState,
    name: dnp.metadata.name,
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
