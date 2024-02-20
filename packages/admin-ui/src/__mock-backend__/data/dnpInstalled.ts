import { InstalledPackageDetailData, PackageContainer } from "@dappnode/types";
import { sampleContainer, sampleDnp } from "./sample";
import { MockDnp } from "./dnps/types";
import { mockDnps } from "./dnps";

// The functions: getContainerName, getContainerDomain and getImageTag are utility functions from the module @dappnode/utils
// they are used in the server mock, and to avoid compiling issues due to not able to use node modules in the browser
// they are copied here

// TODO: either export them from uitls in a subpath separately or find a way to use them in the browser without duplicating them

function getInstalledDnp(dnp: MockDnp): InstalledPackageDetailData {
  const dnpName = dnp.manifest.name;

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
        isCore: dnp.manifest.type === "dncore"
      }),
      image: getImageTag({
        dnpName,
        serviceName,
        version: dnp.manifest.version
      }),
      dnpName,
      serviceName,
      instanceName: "",
      version: dnp.manifest.version,
      ...container
    };
  }

  return {
    ...sampleDnp,

    dnpName,
    instanceName: "",
    isCore: dnp.manifest.type === "dncore",
    avatarUrl: dnp.avatar || "",
    manifest: dnp.manifest,
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

const getContainerName = ({
  dnpName,
  serviceName,
  isCore
}: {
  dnpName: string;
  serviceName: string;
  isCore: boolean;
}): string =>
  // Note: _PREFIX variables already end with the character "-"
  [
    isCore ? "DAppNodeCore-" : "DAppNodePackage-",
    getContainerDomain({ dnpName, serviceName })
  ].join("");

const getContainerDomain = ({
  dnpName,
  serviceName
}: {
  serviceName?: string;
  dnpName: string;
}): string => {
  return !serviceName || serviceName === dnpName
    ? dnpName
    : `${serviceName}.${dnpName}`;
};

const getImageTag = ({
  dnpName,
  serviceName,
  version
}: {
  dnpName: string;
  serviceName: string;
  version: string;
}): string => {
  if (!version) throw new Error("Version is required");
  if (!dnpName) throw new Error("DAppNode package name is required");
  if (!serviceName) throw new Error("Service name is required");
  return [getContainerDomain({ dnpName, serviceName }), version].join(":");
};

export const dnpInstalled = mockDnps.map(getInstalledDnp);
