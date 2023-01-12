import { InstalledPackageDetailData, Routes } from "@dappnode/common";
import { dnpInstalled } from "./data";
import { sampleContainer, sampleDnp } from "./data/sample";
import { pause } from "./utils/pause";

const pkgRestartMs = 2000;

const packagesState = new Map<string, InstalledPackageDetailData>(
  dnpInstalled.map(dnp => [dnp.dnpName, dnp])
);

function update(
  dnpName: string,
  fn: (dnp: InstalledPackageDetailData) => Partial<InstalledPackageDetailData>
) {
  const dnp = packagesState.get(dnpName);
  if (!dnp) throw Error(`dnpName ${dnpName} not found`);
  packagesState.set(dnpName, { ...dnp, ...fn(dnp) });
}

export const packages: Pick<
  Routes,
  | "packageGet"
  | "packageGettingStartedToggle"
  | "packageInstall"
  | "packageLog"
  | "packageRemove"
  | "packageRestart"
  | "packageRestartVolumes"
  | "packageSetEnvironment"
  | "packageSetPortMappings"
  | "packageStartStop"
  | "packagesGet"
> = {
  packageGet: async ({ dnpName }) => {
    const dnp = packagesState.get(dnpName);
    if (!dnp) throw Error(`dnpName ${dnpName} not found`);
    return dnp;
  },

  packageGettingStartedToggle: async ({ dnpName, show }) => {
    update(dnpName, () => ({ gettingStartedShow: show }));
  },

  packageInstall: async ({ name, version, userSettings }) => {
    await pause(pkgRestartMs);
    packagesState.set(name, {
      ...sampleDnp,
      dnpName: name,
      version: version || "0.1.0",
      avatarUrl: "http://example.com:8080/ipfs/Qm",
      origin: undefined,
      gettingStarted: `Welcome to the package **${name}**`,
      gettingStartedShow: true,
      userSettings: (userSettings || {})[name],
      containers: [
        {
          ...sampleContainer,
          containerName: `DAppNodePackage-${name}`,
          containerId: `00000000000${name}`,
          serviceName: name,
          instanceName: "",
          created: 1500000000,
          image: `${name}:${version}`,
          state: "running",
          running: true,
          ports: [],
          volumes: []
        }
      ]
    });
  },

  packageLog: async ({ containerName }) => `INFO: ${containerName} logs`,

  packageRemove: async ({ dnpName }) => {
    await pause(pkgRestartMs);
    packagesState.delete(dnpName);
  },

  packageRestart: async ({ dnpName }) => {
    await pause(pkgRestartMs);
    update(dnpName, dnp => ({
      containers: dnp.containers.map(container => ({
        ...container,
        state: "exited"
      }))
    }));

    await pause(pkgRestartMs);
    update(dnpName, dnp => ({
      containers: dnp.containers.map(container => ({
        ...container,
        state: "running"
      }))
    }));
  },

  packageRestartVolumes: async ({ dnpName }) => {
    throw Error(`Not implemented: ${dnpName}`);
  },

  packageSetEnvironment: async ({ dnpName, environmentByService }) => {
    await pause(pkgRestartMs);
    for (const [serviceName, environment] of Object.entries(
      environmentByService
    )) {
      update(dnpName, dnp => ({
        userSettings: {
          ...dnp.userSettings,
          environment: {
            [serviceName]: {
              ...((dnp.userSettings?.environment || {})[serviceName] || {}),
              ...environment
            }
          }
        }
      }));
    }
  },

  packageSetPortMappings: async ({ dnpName, portMappingsByService }) => {
    await pause(pkgRestartMs);
    for (const [serviceName, portMappings] of Object.entries(
      portMappingsByService
    )) {
      update(dnpName, dnp => ({
        containers: dnp.containers.map(container =>
          container.serviceName === serviceName
            ? { ...container, ports: portMappings }
            : container
        )
      }));
    }
  },

  packageStartStop: async ({ dnpName, serviceNames }) => {
    await pause(pkgRestartMs);
    const dnp = packagesState.get(dnpName);
    if (!dnp) throw Error(`dnpName ${dnpName} not found`);

    update(dnp.dnpName, d => ({
      containers: d.containers.map(container =>
        !serviceNames || serviceNames?.includes(container.serviceName)
          ? {
              ...container,
              running: !container.running,
              state: container.running ? "exited" : "running"
            }
          : container
      )
    }));
  },

  packagesGet: async () => Array.from(packagesState.values())
};
