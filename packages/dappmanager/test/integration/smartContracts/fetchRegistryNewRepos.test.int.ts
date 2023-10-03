import "mocha";
import { expect } from "chai";
import { ethers } from "ethers";
import * as calls from "../../../src/calls/index.js";
import * as db from "../../../src/db/index.js";
import { getRegistryOnRange } from "../../../src/modules/registry/index.js";
import { clearDbs } from "../../testUtils.js";
import { RegistryNewRepoEvent } from "@dappnode/common";

describe.skip("APM Registry", () => {
  before("Clear DBs and set remote", async () => {
    // TODO: TEMP - UNCOMMENT AFTER TESTING
    clearDbs();
    // Activate remote and fallback to fetch test data without a local node
    await calls.ethClientFallbackSet({ fallback: "on" });
    await calls.ethClientTargetSet({ target: "remote" });
  });

  const publicDappnodeEth = "public.dappnode.eth";
  const provider = new ethers.providers.JsonRpcProvider(
    "https://web3.dappnode.net"
  );

  const testCases: {
    registryEns: string;
    fromBlock: number;
    toBlock: number;
    expectedEvents: RegistryNewRepoEvent[];
  }[] = [
    {
      registryEns: publicDappnodeEth,
      fromBlock: 8497450,
      toBlock: 8597419,
      expectedEvents: [
        {
          ensName: "trinity.public.dappnode.eth",
          timestamp: 1567791454,
          txHash:
            "0x76ec638a1fd642976274d501460de73e0eafdd90817e70b672e538718975ba6d"
        },
        {
          ensName: "masterethereum.public.dappnode.eth",
          timestamp: 1569082532,
          txHash:
            "0x508478ce46c94cec853361d777feaed6bb429ff909d53bca44f97c09f4a1d3d6"
        }
      ]
    },
    {
      registryEns: publicDappnodeEth,
      fromBlock: 12755850,
      toBlock: 12755860,
      expectedEvents: [
        {
          ensName: "polygon.public.dappnode.eth",
          timestamp: 1625332089,
          txHash:
            "0x762f847028f9b1d631b4b2745d1af00e979c9891257e52373bbea5b140332c06"
        }
      ]
    },
    {
      registryEns: publicDappnodeEth,
      fromBlock: 12934550,
      toBlock: 12934558,
      expectedEvents: [
        {
          ensName: "binance-smart-chain-node.public.dappnode.eth",
          timestamp: 1627751082,
          txHash:
            "0xe93444d82c732f13901cbe96adc427398cf1738a87377fec865df1e5d8799d44"
        }
      ]
    }
  ];

  for (const { registryEns, fromBlock, toBlock, expectedEvents } of testCases) {
    it(`Fetch repo events from ${registryEns} [${fromBlock},${toBlock}]`, async () => {
      const events = await getRegistryOnRange(
        provider,
        registryEns,
        fromBlock,
        toBlock
      );

      expect(events).to.deep.equal(expectedEvents);
    });
  }

  it.skip("Fetch all events from public.dappnode.eth", async function () {
    // takes a loooong time
    this.timeout(30 * 60 * 1000);

    await getRegistryOnRange(
      provider,
      publicDappnodeEth,
      // 6312046, // Deploy block
      8905883,
      await provider.getBlockNumber(),
      // Log events for sanity during the long wait
      (events, range) => {
        console.log(range, range[1] - range[0], events);
        if (events.length > 0) {
          const cachedLogs = db.registryEvents.get(publicDappnodeEth) || [];
          for (const log of events) cachedLogs.push(log);
          db.registryEvents.set(publicDappnodeEth, cachedLogs);
        }
      },
      (error, range) => console.log(range, range[1] - range[0], error)
    );
  });
});
