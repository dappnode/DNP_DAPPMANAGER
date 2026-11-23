import { expect } from "chai";
import { InstalledPackageData, PackageContainer } from "@dappnode/types";
import { PackageStopDocker, stopPackageForBackup } from "../../../src/fullBackup/packageStop.js";

const dnpName = "web3signer.dnp.dappnode.eth";

function container(serviceName: string, state: PackageContainer["state"]): PackageContainer {
  return {
    containerName: `DAppNodePackage-${serviceName}.${dnpName}`,
    serviceName,
    dnpName,
    state,
    running: state === "running"
  } as unknown as PackageContainer;
}

function installedPkg(states: Record<string, PackageContainer["state"]>): InstalledPackageData {
  const containers = Object.entries(states).map(([serviceName, state]) => container(serviceName, state));
  return { dnpName, isCore: false, containers } as unknown as InstalledPackageData;
}

/** A fake docker that keeps the state of the containers and records the compose calls */
function fakeDocker(pkg: InstalledPackageData, events: string[], overrides: Partial<PackageStopDocker> = {}) {
  let current = pkg;
  const setState = (services: string[] | undefined, state: PackageContainer["state"]): void => {
    current = {
      ...current,
      containers: current.containers.map((c) =>
        !services || services.includes(c.serviceName) ? container(c.serviceName, state) : c
      )
    };
  };
  const docker: PackageStopDocker = {
    composeStop: async (_dcPath, options) => {
      events.push(`stop ${JSON.stringify(options)}`);
      setState(undefined, "exited");
      return "";
    },
    composeStart: async (_dcPath, services) => {
      events.push(`start ${services?.join(" ")}`);
      setState(services, "running");
      return "";
    },
    listPackage: async () => current,
    ...overrides
  };
  return docker;
}

describe("fullBackup / stopPackageForBackup", () => {
  it("restarts only the services that were running, in one compose call", async () => {
    // A one-shot migration container that exited and a service the user stopped
    const pkg = installedPkg({ flyway: "exited", postgres: "running", signer: "running", brain: "exited" });
    const events: string[] = [];
    const restart = await stopPackageForBackup(pkg, fakeDocker(pkg, events));
    expect(events).to.deep.equal(["stop {}"]);

    await restart?.();
    expect(events).to.deep.equal(["stop {}", "start postgres signer"]);
  });

  it("stops a restarting container too, and starts it again", async () => {
    const pkg = installedPkg({ signer: "restarting" });
    const events: string[] = [];
    const restart = await stopPackageForBackup(pkg, fakeDocker(pkg, events));
    await restart?.();
    expect(events).to.deep.equal(["stop {}", "start signer"]);
  });

  it("passes the longest dockerTimeout of the package", async () => {
    const pkg = installedPkg({ postgres: "running", signer: "running" });
    pkg.containers[0].dockerTimeout = 30;
    pkg.containers[1].dockerTimeout = 120;
    const events: string[] = [];
    await stopPackageForBackup(pkg, fakeDocker(pkg, events));
    expect(events).to.deep.equal(['stop {"timeout":120}']);
  });

  it("returns null without stopping anything when nothing was running", async () => {
    const pkg = installedPkg({ flyway: "exited", signer: "exited" });
    const events: string[] = [];
    expect(await stopPackageForBackup(pkg, fakeDocker(pkg, events))).to.equal(null);
    expect(events).to.deep.equal([]);
  });

  it("starts again what a stop that failed part-way took down", async () => {
    const pkg = installedPkg({ postgres: "running", signer: "running" });
    const events: string[] = [];
    const docker = fakeDocker(pkg, events, {
      composeStop: async () => {
        events.push("stop");
        throw Error("timeout stopping postgres");
      }
    });
    try {
      await stopPackageForBackup(pkg, docker);
      throw Error("Expected an error");
    } catch (e) {
      expect((e as Error).message).to.equal("timeout stopping postgres");
    }
    expect(events).to.deep.equal(["stop", "start postgres signer"]);
  });

  it("says so when the package could not be started again either", async () => {
    const pkg = installedPkg({ signer: "running" });
    const docker = fakeDocker(pkg, [], {
      composeStop: async () => {
        throw Error("timeout stopping signer");
      },
      composeStart: async () => {
        throw Error("docker is down");
      }
    });
    try {
      await stopPackageForBackup(pkg, docker);
      throw Error("Expected an error");
    } catch (e) {
      expect((e as Error).message)
        .to.include("timeout stopping signer")
        .and.include("could not be started again")
        .and.include("docker is down");
    }
  });

  it("fails if a container still runs after the stop", async () => {
    const pkg = installedPkg({ postgres: "running", signer: "running" });
    const events: string[] = [];
    const docker = fakeDocker(pkg, events, {
      // The stop reports success but the signer was not stopped
      composeStop: async () => "",
      listPackage: async () => installedPkg({ postgres: "exited", signer: "running" })
    });
    try {
      await stopPackageForBackup(pkg, docker);
      throw Error("Expected an error");
    } catch (e) {
      expect((e as Error).message).to.equal("these services are still running: signer");
    }
    expect(events).to.deep.equal(["start postgres signer"]);
  });

  it("fails if the package was started after it was listed as stopped", async () => {
    const pkg = installedPkg({ signer: "exited" });
    const events: string[] = [];
    const docker = fakeDocker(pkg, events, { listPackage: async () => installedPkg({ signer: "running" }) });
    try {
      await stopPackageForBackup(pkg, docker);
      throw Error("Expected an error");
    } catch (e) {
      expect((e as Error).message).to.equal("these services are still running: signer");
    }
    expect(events).to.deep.equal([]);
  });
});
