import "mocha";
import { expect } from "chai";
import sinon from "sinon";
import rewiremock from "rewiremock/node.js";
// imports for typings
import {
  UserSettings,
  InstalledPackageData,
  Eth2ClientTarget,
  EthClientRemote,
  EthClientInstallStatus,
} from "@dappnode/types";
import { mockDnp, mockContainer, dappnodeInstaller } from "../testUtils.js";

interface State {
  target: Eth2ClientTarget;
  status: { [target: string]: EthClientInstallStatus };
}

describe.skip("daemons > ethMultiClient > runWatcher", () => {
  it("Simulate a client change process", async () => {
    let currentExecClient: string | null | undefined =
      "besu.public.dappnode.eth";
    let currentConsClient: string | null | undefined = "prysm.dnp.dappnode.eth";
    let currentRemote: EthClientRemote | null = EthClientRemote.on;
    const newTarget: Eth2ClientTarget = {
      execClient: "geth.dnp.dappnode.eth",
      consClient: "lighthouse.dnp.dappnode.eth",
    };

    /**
     * Mutetable state used by the mock DB
     */
    const state: State = {
      target: "remote",
      status: {},
    };

    /**
     * Mutable state used by listContainerNoThrow
     */
    const dnpList: InstalledPackageData[] = [];

    // Disable return typing for the db object since it's extremely verbose and unnecessary for a mock test
    // Also, it will be enforced by rewiremock in case of error
    const db = {
      executionClientMainnet: {
        get: (): string | null | undefined => currentExecClient,
        set: async (execClient: string | null | undefined) => {
          currentExecClient = execClient;
        },
      },
      consensusClientMainnet: {
        get: (): string | null | undefined => currentConsClient,
        set: async (consClient: string | null | undefined) => {
          currentConsClient = consClient;
        },
      },
      ethClientRemote: {
        get: (): EthClientRemote | null => currentRemote,
        set: (target: EthClientRemote | null) => {
          currentRemote = target;
        },
      },
      ethExecClientInstallStatus: {
        getAll: () => ({}),
        get: (keyArg: string) => state.status[keyArg],
        set: (keyArg: string, status: EthClientInstallStatus) => {
          state.status[keyArg] = status;
        },
        remove: (keyArg: string) => {
          keyArg;
        },
      },
      ethConsClientInstallStatus: {
        getAll: () => ({}),
        get: (keyArg: string) => state.status[keyArg],
        set: (keyArg: string, status: EthClientInstallStatus) => {
          state.status[keyArg] = status;
        },
        remove: (keyArg: string) => {
          keyArg;
        },
      },
      fullnodeDomainTarget: {
        get: (): string => "",
        set: (dnpName: string) => {
          dnpName;
        },
      },
      ethClientUserSettings: {
        getAll: () => ({}),
        get: (keyArg: Eth2ClientTarget): UserSettings => {
          keyArg;
          return {};
        },
        set: (keyArg: Eth2ClientTarget, userSettings: UserSettings) => {
          keyArg;
          userSettings;
        },
        remove: (keyArg: Eth2ClientTarget) => {
          keyArg;
        },
      },
    };
    /* eslint-enable @typescript-eslint/explicit-function-return-type */

    async function listPackageNoThrow({
      dnpName,
    }: {
      dnpName: string;
    }): Promise<InstalledPackageData | null> {
      return dnpList.find((d) => d.dnpName === dnpName) || null;
    }

    const packageInstall = sinon.mock().atLeast(2).resolves({ message: "" });
    // async function packageInstall(): Promise<{ message: string }> {
    //   return { message: "" };
    // }

    const { runEthClientInstaller } = await rewiremock.around(
      () => import("../../src/ethMultiClient/index.js"),
      (mock) => {
        mock(() => import("@dappnode/db"))
          .with(db)
          .toBeUsed();
        mock(() => import("@dappnode/dockerapi"))
          .with({ listPackageNoThrow })
          .toBeUsed();
        mock(() => import("@dappnode/installer"))
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
        const { execClient, consClient } = target;
        for (const client of [consClient, execClient]) {
          const nextStatus = await runEthClientInstaller(
            dappnodeInstaller,
            client,
            state.status[client]
          );
          if (nextStatus) state.status[client] = nextStatus;
        }
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
        status: {},
      } as State,
      "State should be equal to initial"
    );

    // Simulate user selecting a new target
    state.target = newTarget;
    await runClientInstallerWatcher();
    expect(state).to.deep.equal(
      {
        target: newTarget,
        status: {
          [newTarget.execClient]: { status: "INSTALLED" },
          [newTarget.consClient]: { status: "INSTALLED" },
        },
      } as State,
      "After the user selects a new target it should start installing"
    );
    sinon.assert.calledTwice(packageInstall);

    // Simulate the package starts running after being installed
    dnpList.push(
      {
        ...mockDnp,
        dnpName: newTarget.execClient,
        containers: [{ ...mockContainer, running: true }],
      },
      {
        ...mockDnp,
        dnpName: newTarget.consClient,
        containers: [{ ...mockContainer, running: true }],
      }
    );

    await runClientInstallerWatcher();
    expect(state).to.deep.equal(
      {
        target: newTarget,
        status: {
          [newTarget.execClient]: { status: "INSTALLED" },
          [newTarget.consClient]: { status: "INSTALLED" },
        },
      } as State,
      "After installation, the loop does nothing"
    );
  });
});
