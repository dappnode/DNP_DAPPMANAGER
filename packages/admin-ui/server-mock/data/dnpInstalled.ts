import { InstalledPackageDetailData } from "../../src/common";
import { samplePackageContainer } from "./sample";
import { MockDnp } from "./dnps/types";
import { mockDnps } from "./dnps";

function getInstalledDnp(dnp: MockDnp): InstalledPackageDetailData {
  return {
    ...samplePackageContainer,
    ...dnp.installedData,
    name: dnp.metadata.name,
    isCore: dnp.metadata.type === "dncore",
    avatarUrl: dnp.avatar || "",
    manifest: dnp.metadata,
    userSettings: dnp.userSettings,
    setupWizard: dnp.setupWizard
  };
}

export const dnpInstalled = mockDnps.map(getInstalledDnp);
