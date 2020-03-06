import "mocha";
import { expect } from "chai";
import {
  PackageContainer,
  EthClientTarget,
  EthClientStatus
} from "../../../src/types";
import rewiremock from "rewiremock";
// imports for typings
import { mockDnp } from "../../testUtils";
import { getClientData } from "../../../src/watchers/ethMultiClient/clientParams";

interface State {
  target: EthClientTarget;
  status: EthClientStatus;
  statusError?: string;
}

describe("Watchers > ethMultiClient > runWatcher", () => {
  it("Simulate a client change process", async () => {
    const newTarget: EthClientTarget = "geth";
    const newTargetData = getClientData(newTarget);

    /**
     * Mutetable state used by the mock DB
     */
    const state: State = {
      target: "remote",
      status: "selected"
    };

    /**
     * Mutable state used by isSyncing
     */
    const isSyncingState: { [url: string]: boolean } = {};

    /**
     * Mutable state used by listContainerNoThrow
     */
    const dnpList: PackageContainer[] = [];

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
      ethClientStatus: {
        get: () => state.status,
        set: (status: EthClientStatus) => {
          state.status = status;
        }
      },
      setEthClientStatusAndError: (status: EthClientStatus, e?: Error) => {
        state.status = status;
        if (e) state.statusError = e.message;
        else delete state.statusError;
      },
      fullnodeDomainTarget: {
        get: (): string => "",
        set: (_: string) => {}
      }
    };
    /* eslint-enable @typescript-eslint/explicit-function-return-type */

    async function isSyncing(url: string): Promise<boolean> {
      if (typeof isSyncingState[url] !== "boolean")
        throw Error(`Is syncing fake call failed for unknown url: ${url}`);
      return isSyncingState[url];
    }

    async function listContainerNoThrow(
      name: string
    ): Promise<PackageContainer | null> {
      return dnpList.find(dnp => dnp.name === name) || null;
    }

    async function installPackage(): Promise<{ message: string }> {
      return { message: "" };
    }

    const { runEthMultiClientWatcher } = await rewiremock.around(
      () => import("../../../src/watchers/ethMultiClient"),
      mock => {
        mock(() => import("../../../src/db"))
          .with(db)
          .toBeUsed();
        mock(() => import("../../../src/utils/isSyncing"))
          .with({ isSyncing })
          .toBeUsed();
        mock(() => import("../../../src/modules/docker/listContainers"))
          .with({ listContainerNoThrow })
          .toBeUsed();
        mock(() => import("../../../src/calls"))
          .with({ installPackage })
          .toBeUsed();
      }
    );

    // ////////////////////////////////
    // Simulate a client change process
    // ////////////////////////////////

    // State should be equal to initial
    await runEthMultiClientWatcher();
    expect(state).to.deep.equal(
      {
        target: "remote",
        status: "selected"
      } as State,
      "State should be equal to initial"
    );

    // Simulate user selecting a new target
    state.target = newTarget;
    await runEthMultiClientWatcher();
    expect(state).to.deep.equal(
      {
        target: newTarget,
        status: "installed"
      } as State,
      "After the user selects a new target it should start installing"
    );

    // Simulate the package starts running after being installed
    dnpList.push({
      ...mockDnp,
      name: newTargetData.name,
      running: true
    });
    isSyncingState[newTargetData.url] = true;
    await runEthMultiClientWatcher();
    expect(state).to.deep.equal(
      {
        target: newTarget,
        status: "syncing"
      } as State,
      "After installation, the package is syncing"
    );

    // Simulate the package finishes syncing
    isSyncingState[newTargetData.url] = false;
    await runEthMultiClientWatcher();
    expect(state).to.deep.equal(
      {
        target: newTarget,
        status: "active"
      } as State,
      "When completing sync, package should be activated"
    );
  });
});
