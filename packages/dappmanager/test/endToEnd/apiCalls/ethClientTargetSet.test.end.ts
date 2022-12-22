import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl } from "../endToEndUtils";
import {
  ConsensusClientMainnet,
  ExecutionClientMainnet
} from "../../../src/common";
import params from "../../../src/params";

const apiCallMethod = "ethClientTargetSet";
const url = new URL(`${dappmanagerTestApiUrl}/${apiCallMethod}`);

describe.skip(`API call ${apiCallMethod}`, async function () {
  // This end to end test may need lot of time
  this.timeout(1200000);
  const executionClients: ExecutionClientMainnet[] = [
    "besu.public.dappnode.eth",
    "nethermind.public.dappnode.eth",
    "erigon.dnp.dappnode.eth",
    "geth.dnp.dappnode.eth"
  ];
  const consensusClients: ConsensusClientMainnet[] = [
    "prysm.dnp.dappnode.eth",
    "lighthouse.dnp.dappnode.eth",
    "teku.dnp.dappnode.eth",
    "nimbus.dnp.dappnode.eth"
  ];

  /**
   * Set fallback to true to ensure eth repository is available
   * and IPFS client target to remote to speed up the download
   */
  before(async () => {
    const fallbackUrl = new URL(
      `${dappmanagerTestApiUrl}/ethClientFallbackSet`
    );
    fallbackUrl.searchParams.set("fallback", "on");
    const fallbackResponse = await fetch(fallbackUrl);
    expect(fallbackResponse.status).to.equal(200);

    const ipfsClientUrl = new URL(
      `${dappmanagerTestApiUrl}/ipfsClientTargetSet`
    );
    const data = {
      ipfsRpository: {
        ipfsClientTarget: "remote",
        ipfsGateway: params.IPFS_REMOTE
      }
    };
    ipfsClientUrl.searchParams.set(
      "ipfsRepository",
      JSON.stringify(data.ipfsRpository)
    );
    const ipfsResponse = await fetch(ipfsClientUrl);
    expect(ipfsResponse.status).to.equal(200);
  });

  // TODO: After all the tests remove the clients and volumes

  /**
   * Execution client - Consensus client
   */
  for (const execClient of executionClients) {
    for (const consClient of consensusClients) {
      it(`Should set ethClientTargetSet to ${execClient} - ${consClient}`, async () => {
        const data = {
          target: {
            execClient,
            consClient
          },
          sync: true,
          useCheckpointSync: true,
          deletePrevExecClient: false,
          deletePrevExecClientVolumes: false,
          deletePrevConsClient: false,
          deletePrevConsClientVolumes: false
        };
        url.searchParams.set("target", JSON.stringify(data.target));
        url.searchParams.set("sync", data.sync.toString());
        url.searchParams.set(
          "useCheckpointSync",
          data.useCheckpointSync.toString()
        );
        url.searchParams.set(
          "deletePrevExecClient",
          data.deletePrevExecClient.toString()
        );
        url.searchParams.set(
          "deletePrevExecClientVolumes",
          data.deletePrevExecClientVolumes.toString()
        );
        url.searchParams.set(
          "deletePrevConsClient",
          data.deletePrevConsClient.toString()
        );
        url.searchParams.set(
          "deletePrevConsClientVolumes",
          data.deletePrevConsClientVolumes.toString()
        );
        console.log(`Setting ethClientTarget to ${execClient} - ${consClient}`);
        const response = await fetch(url);
        expect(response.status).to.equal(200);

        // Check the ethClientTarget was set
      });
    }
  }

  /**
   * Remote
   */
  it("Should set ethClientTargetSet to Remote", async () => {
    const data = {
      target: "remote",
      sync: true,
      useCheckpointSync: true,
      deletePrevExecClient: false,
      deletePrevExecClientVolumes: false,
      deletePrevConsClient: false,
      deletePrevConsClientVolumes: false
    };
    url.searchParams.set("target", JSON.stringify(data.target));
    url.searchParams.set("sync", data.sync.toString());
    url.searchParams.set(
      "useCheckpointSync",
      data.useCheckpointSync.toString()
    );
    url.searchParams.set(
      "deletePrevExecClient",
      data.deletePrevExecClient.toString()
    );
    url.searchParams.set(
      "deletePrevExecClientVolumes",
      data.deletePrevExecClientVolumes.toString()
    );
    url.searchParams.set(
      "deletePrevConsClient",
      data.deletePrevConsClient.toString()
    );
    url.searchParams.set(
      "deletePrevConsClientVolumes",
      data.deletePrevConsClientVolumes.toString()
    );
    const response = await fetch(url);
    expect(response.status).to.equal(200);
  });
});
