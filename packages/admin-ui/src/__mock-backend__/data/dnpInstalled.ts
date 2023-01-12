import { InstalledPackageDetailData, PackageContainer } from "@dappnode/common";
import { sampleContainer, sampleDnp } from "./sample";
import { MockDnp } from "./dnps/types";
import { mockDnps } from "./dnps";
import { getContainerName, getImageTag } from "./params";

function getInstalledDnp(dnp: MockDnp): InstalledPackageDetailData {
  const dnpName = dnp.metadata.name;

  function getContainer(
    serviceName: string,
    container: Partial<PackageContainer>
  ): PackageContainer {
    return {
      ...sampleContainer,
      containerId: `0000000000000${dnpName}`,
      containerName: getContainerName({
        dnpName,
        serviceName,
        isCore: dnp.metadata.type === "dncore"
      }),
      image: getImageTag({
        dnpName,
        serviceName,
        version: dnp.metadata.version
      }),
      dnpName,
      serviceName,
      instanceName: "",
      version: dnp.metadata.version,
      ...container
    };
  }

  return {
    ...sampleDnp,

    dnpName,
    instanceName: "",
    isCore: dnp.metadata.type === "dncore",
    avatarUrl: dnp.avatar || "",
    manifest: dnp.metadata,
    userSettings: { environment: dnp.userSettings?.environment },
    setupWizard: dnp.setupWizard && {
      ...dnp.setupWizard,
      fields: dnp.setupWizard.fields.filter(
        f => f.target?.type === "environment"
      )
    },
    containers: dnp.installedContainers
      ? Object.entries(dnp.installedContainers).map(
          ([serviceName, container]) => ({
            ...getContainer(serviceName, container),
            ...container
          })
        )
      : [getContainer(dnpName, {})],

    ...dnp.installedData
  };
}

export const dnpInstalled = mockDnps.map(getInstalledDnp);
