import "mocha";
import { expect } from "chai";
import { ethers } from "ethers";
import * as calls from "../../../src/calls";
import { abi } from "../../../src/contracts/registry";
import {
  getTopicFromEvent,
  getParsedLogs,
  getArgFromParsedLogs,
  getRegistry,
  getBlocksSections
} from "../../../src/modules/registry";
import { clearDbs } from "../../testUtils";
import { DirectoryItem } from "../../../src/types";

describe("Directory", () => {
  before("Clear DBs and set remote", async () => {
    clearDbs();
    // Activate remote and fallback to fetch test data without a local node
    await calls.ethClientFallbackSet({ fallback: "on" });
    await calls.ethClientTargetSet({ target: "remote" });
  });
  const fromBlock = 10076527;
  const toBlock = 10405289;
  const dappnodePublicEns = "public.dappnode.eth";

  const provider = new ethers.providers.JsonRpcProvider(
    "https://web3.dappnode.net"
  );
  const iface = new ethers.utils.Interface(abi);
  const logs = [
    {
      blockNumber: 8497779,
      blockHash:
        "0x091c7535941aed4e0a68b8a26f19c359b69d8518767b352c120c3c0d22720e19",
      transactionIndex: 23,
      removed: false,
      address: "0x9F85AE5aeFE4a3eFF39d9A44212aae21Dd15079A",
      data:
        "0x424563bbed4a267a3338d9a5772c5671677042c6fdab1d992fe3b2bb845931630000000000000000000000000000000000000000000000000000000000000060000000000000000000000000ee09d2b1772495028939cd8cee59ca0f0bc6bba100000000000000000000000000000000000000000000000000000000000000077472696e69747900000000000000000000000000000000000000000000000000",
      topics: [
        "0x526d4ccf8c3d7b6f0b6d4cc0de526d515c87d1ea3bd264ace0b5c2e70d1b2208"
      ],
      transactionHash:
        "0x76ec638a1fd642976274d501460de73e0eafdd90817e70b672e538718975ba6d",
      logIndex: 23
    },
    {
      blockNumber: 8593620,
      blockHash:
        "0x7ba7136b509da6d148a51673cf154c57ce8136c8bdc6d99e6dd690ea0ffbfac9",
      transactionIndex: 91,
      removed: false,
      address: "0x9F85AE5aeFE4a3eFF39d9A44212aae21Dd15079A",
      data:
        "0x2e3da36a87d14fb6b3e0a7c6baad472a411d1271529917e75c4de28d6f46e9f300000000000000000000000000000000000000000000000000000000000000600000000000000000000000001b66cc0563e32f60e929bff26ccbb7084f98821b000000000000000000000000000000000000000000000000000000000000000e6d6173746572657468657265756d000000000000000000000000000000000000",
      topics: [
        "0x526d4ccf8c3d7b6f0b6d4cc0de526d515c87d1ea3bd264ace0b5c2e70d1b2208"
      ],
      transactionHash:
        "0x508478ce46c94cec853361d777feaed6bb429ff909d53bca44f97c09f4a1d3d6",
      logIndex: 46
    },
    {
      blockNumber: 8656925,
      blockHash:
        "0x7843db9fe1056a0fe108bb7fcab29361738073ed12c7220722a9c57f1f19f890",
      transactionIndex: 162,
      removed: false,
      address: "0x9F85AE5aeFE4a3eFF39d9A44212aae21Dd15079A",
      data:
        "0xb65f0ce53546196631dc3a0d3bbdc77677ca672cb2dad349744b7a978f6157130000000000000000000000000000000000000000000000000000000000000060000000000000000000000000191b717c27677b3dc8903230030b6747614c45f500000000000000000000000000000000000000000000000000000000000000057a63617368000000000000000000000000000000000000000000000000000000",
      topics: [
        "0x526d4ccf8c3d7b6f0b6d4cc0de526d515c87d1ea3bd264ace0b5c2e70d1b2208"
      ],
      transactionHash:
        "0x37fcdc918a5109a636ccbe1e94be0d9d5b914eb8cd34ac82791d8a65bb0aebb7",
      logIndex: 136
    },
    {
      blockNumber: 8773406,
      blockHash:
        "0xffe360d504fac6eb3a1455db27e242f3f4cbb8fcdf4c843f1b695343102dc34c",
      transactionIndex: 187,
      removed: false,
      address: "0x9F85AE5aeFE4a3eFF39d9A44212aae21Dd15079A",
      data:
        "0x55cfa467689f95088f0cbea7cf28725e809228b3ee7af8b749fdafd6a917c0cd0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000cd870fa2f92978e64626ce6b24f2e2d39d04c1890000000000000000000000000000000000000000000000000000000000000008706f6c6b61646f74000000000000000000000000000000000000000000000000",
      topics: [
        "0x526d4ccf8c3d7b6f0b6d4cc0de526d515c87d1ea3bd264ace0b5c2e70d1b2208"
      ],
      transactionHash:
        "0xa93e49229fd4ba49a64e3436d0adf678edc9decfc06c72445afb32b6d83f3575",
      logIndex: 119
    }
  ];
  let topic: string;

  it("Should return sections of 40000 blocks", () => {
    const latestBlock = 12992306;
    const latestBlockTest = 12545306;

    const expectedBlockSections = [
      { fromBlock: 12545306, toBlock: 12585306 },
      { fromBlock: 12585306, toBlock: 12625306 },
      { fromBlock: 12625306, toBlock: 12665306 },
      { fromBlock: 12665306, toBlock: 12705306 },
      { fromBlock: 12705306, toBlock: 12745306 },
      { fromBlock: 12745306, toBlock: 12785306 },
      { fromBlock: 12785306, toBlock: 12825306 },
      { fromBlock: 12825306, toBlock: 12865306 },
      { fromBlock: 12865306, toBlock: 12905306 },
      { fromBlock: 12905306, toBlock: 12945306 },
      { fromBlock: 12945306, toBlock: 12985306 },
      { fromBlock: 12985306, toBlock: 12992306 }
    ];

    const sections = getBlocksSections(latestBlock, latestBlockTest);
    expect(sections).to.deep.equal(expectedBlockSections);
  });

  it("Should get topic from event", () => {
    const expectedTopic =
      "0x526d4ccf8c3d7b6f0b6d4cc0de526d515c87d1ea3bd264ace0b5c2e70d1b2208";
    topic = getTopicFromEvent(iface, "NewRepo");
    expect(topic).to.deep.equal(expectedTopic);
  });

  it("Should get arg from parsed logs", () => {
    const parsedLogs = getParsedLogs(iface, logs, topic);
    const expectedArgs = ["trinity", "masterethereum", "zcash", "polkadot"];
    const args = getArgFromParsedLogs(parsedLogs, 1);
    expect(args).to.deep.equal(expectedArgs);
  });

  it("Should fetch Registry SC and get newRepos from a given ENS", async () => {
    const expectedPackages = [
      {
        name: "big-dipper.public.dappnode.eth",
        statusName: "Active",
        position: 0,
        isFeatured: false,
        featuredIndex: 0
      },
      {
        name: "electrumx.public.dappnode.eth",
        statusName: "Active",
        position: 1,
        isFeatured: false,
        featuredIndex: 0
      },
      {
        name: "idchain.public.dappnode.eth",
        statusName: "Active",
        position: 2,
        isFeatured: false,
        featuredIndex: 0
      },
      {
        name: "sentinel.public.dappnode.eth",
        statusName: "Active",
        position: 3,
        isFeatured: false,
        featuredIndex: 0
      }
    ];

    const packages = await getRegistry(
      provider,
      dappnodePublicEns,
      fromBlock,
      toBlock
    );

    expect(packages).to.deep.equal(expectedPackages);
  });

  it("Should fetch Registry data", async () => {
    const registryData = await calls.fetchRegistry({
      addressOrEnsName: dappnodePublicEns,
      fromBlock,
      toBlock
    });

    const expectedRegistryData: DirectoryItem[] = [
      {
        index: 1,
        name: "electrumx.public.dappnode.eth",
        isFeatured: false,
        whitelisted: true,
        status: "ok",
        description: "A personal Electrum server",
        avatarUrl: "/ipfs/QmQT1BkQDcCW5Qdip3eigrgnxKqyrmrjkxXejwHsA3dHaz",
        isInstalled: false,
        isUpdated: false,
        featuredStyle: undefined,
        categories: []
      },
      {
        index: 0,
        name: "big-dipper.public.dappnode.eth",
        isFeatured: false,
        whitelisted: true,
        status: "ok",
        description: "Tendermint Block Explorer",
        avatarUrl: "/ipfs/QmbTYUuVizPqs2FRyfVZvxhDFAH1VpK9F5swtvJcHLi2AW",
        isInstalled: false,
        isUpdated: false,
        featuredStyle: undefined,
        categories: ["Blockchain"]
      },
      {
        index: 2,
        name: "idchain.public.dappnode.eth",
        isFeatured: false,
        whitelisted: true,
        status: "ok",
        description: "IDChain from BrightID.",
        avatarUrl: "/ipfs/QmdJyHFAYsbDAM84NKem38vEPsFtCcztoxLuQac5312eEq",
        isInstalled: false,
        isUpdated: false,
        featuredStyle: undefined,
        categories: ["Blockchain"]
      },
      {
        index: 3,
        name: "sentinel.public.dappnode.eth",
        isFeatured: false,
        whitelisted: true,
        status: "ok",
        description: "Sentinel dVPN node",
        avatarUrl: "/ipfs/QmVHENs72iFxNMGRmM29stHVTsicNf8qFpjPPwuvbsnzrT",
        isInstalled: false,
        isUpdated: false,
        featuredStyle: undefined,
        categories: ["dVPN"]
      }
    ];

    // Compare unordered because the packages are pushed as they are resolved
    expect(registryData).to.have.deep.members(expectedRegistryData);
  });
});
