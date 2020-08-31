import { InstalledPackageDetailData } from "../../src/common";
import { sampleContainer, sampleDnp } from "./sample";
import { MockDnp } from "./dnps/types";
import { mockDnps } from "./dnps";

function getInstalledDnp(dnp: MockDnp): InstalledPackageDetailData {
  const dnpName = dnp.metadata.name;
  return {
    ...sampleDnp,
    ...dnp.installedData,
    dnpName,
    instanceName: "",
    isCore: dnp.metadata.type === "dncore",
    avatarUrl: dnp.avatar || "",
    manifest: dnp.metadata,
    userSettings: dnp.userSettings,
    setupWizard: dnp.setupWizard,
    containers: [
      {
        ...sampleContainer,
        containerId: `0000000000000${dnpName}`,
        containerName: `DAppNodePackage-${dnpName}`,
        dnpName,
        serviceName: dnpName,
        instanceName: "",
        version: dnp.metadata.version,
        ...(dnp.installedContainer || {})
      }
    ]
  };
}

export const dnpInstalled = mockDnps.map(getInstalledDnp);
