import "mocha";
import { expect } from "chai";
import sinon from "sinon";
import rewiremock from "rewiremock";
// imports for typings
import {
  EthClientTarget,
  UserSettings,
  InstalledPackageData
} from "../../../src/types";
import { mockDnp, mockContainer } from "../../testUtils";
import { EthClientInstallStatus } from "../../../src/modules/ethClient/types";
import { ethClientData } from "../../../src/params";

interface State {
  target: EthClientTarget;
  status: { [target: string]: EthClientInstallStatus };
}

describe("daemons > ethMultiClient > runWatcher", () => {
  it("Simulate a client change process", async () => {
    const newTarget: EthClientTarget = "nethermind-xdai";
    const newTargetData = ethClientData[newTarget];

    /**
     * Mutetable state used by the mock DB
     */
    const state: State = {
      target: "remote",
      status: {}
    };

    /**
     * Mutable state used by listContainerNoThrow
     */
    const dnpList: InstalledPackageData[] = [];

    // Disable return typing for the db object since it's extremely verbose and unnecessary for a mock test
    // Also, it will be enforced by rewiremock in case of error
    /* eslint-disable @typescript-eslint/explicit-function-return-type */
    const db = {
      ethClientTarget: {
        get: () => state.target,
        set: (target: EthClientTarget) => {
          state.target = target;
        }
      },
      ethClientInstallStatus: {
        getAll: () => ({}),
        get: (keyArg: EthClientTarget) => state.status[keyArg],
        set: (keyArg: EthClientTarget, status: EthClientInstallStatus) => {
          state.status[keyArg] = status;
        },
        remove: (keyArg: EthClientTarget) => {
          keyArg;
        }
      },
      fullnodeDomainTarget: {
        get: (): string => "",
        set: (dnpName: string) => {
          dnpName;
        }
      },
      ethClientUserSettings: {
        getAll: () => ({}),
        get: (keyArg: EthClientTarget): UserSettings => {
          keyArg;
          return {};
        },
        set: (keyArg: EthClientTarget, userSettings: UserSettings) => {
          keyArg;
          userSettings;
        },
        remove: (keyArg: EthClientTarget) => {
          keyArg;
        }
      }
    };
    /* eslint-enable @typescript-eslint/explicit-function-return-type */

    async function listPackageNoThrow({
      dnpName
    }: {
      dnpName: string;
    }): Promise<InstalledPackageData | null> {
      return dnpList.find(d => d.dnpName === dnpName) || null;
    }

    const packageInstall = sinon.mock().resolves({ message: "" });
    // async function packageInstall(): Promise<{ message: string }> {
    //   return { message: "" };
    // }

    const { runEthClientInstaller } = await rewiremock.around(
      () => import("../../../src/daemons/ethMultiClient"),
      mock => {
        mock(() => import("../../../src/db"))
          .with(db)
          .toBeUsed();
        mock(() => import("../../../src/modules/docker/list"))
          .with({ listPackageNoThrow })
          .toBeUsed();
        mock(() => import("../../../src/calls"))
          .with({ packageInstall })
          .toBeUsed();
      }
    );

    /**
     * Recreate the behaviour of the multi-client watcher
     */
    async function runClientInstallerWatcher(): Promise<void> {
      const target = state.target;
      if (target && target !== "remote") {
        const nextStatus = await runEthClientInstaller(
          state.target,
          state.status[target]
        );
        if (nextStatus) state.status[target] = nextStatus;
      }
    }

    // ////////////////////////////////
    // Simulate a client change process
    // ////////////////////////////////

    // State should be equal to initial
    await runClientInstallerWatcher();
    expect(state).to.deep.equal(
      {
        target: "remote",
        status: {}
      } as State,
      "State should be equal to initial"
    );

    // Simulate user selecting a new target
    state.target = newTarget;
    await runClientInstallerWatcher();
    expect(state).to.deep.equal(
      {
        target: newTarget,
        status: { [newTarget]: { status: "INSTALLED" } }
      } as State,
      "After the user selects a new target it should start installing"
    );
    sinon.assert.calledOnce(packageInstall);

    // Simulate the package starts running after being installed
    dnpList.push({
      ...mockDnp,
      dnpName: newTargetData.dnpName,
      containers: [{ ...mockContainer, running: true }]
    });
    await runClientInstallerWatcher();
    expect(state).to.deep.equal(
      {
        target: newTarget,
        status: { [newTarget]: { status: "INSTALLED" } }
      } as State,
      "After installation, the loop does nothing"
    );
  });
});
