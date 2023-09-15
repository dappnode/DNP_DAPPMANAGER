import "mocha";
import { expect } from "chai";
import { addAliasToRunningContainers } from "../../src/modules/migrations/addAliasToRunningContainers";
import { listContainers } from "../../src/modules/docker/list/index"
import { shellSafe } from "../testUtils";
import fs from "fs";
import { docker } from "../../src/modules/docker/api/docker";

describe("addAliasToRunningContainers", () => {

// Example package
const dnpName = "prysm.dnp.dappnode.eth";
const dnpPrysmPath = process.cwd() + "/dnp_repo/" + dnpName;
const prysmCompose = `
version: "3.4"
services:
  beacon-chain:
    image: "beacon-chain.prysm.dnp.dappnode.eth:2.0.0"
    build:
      context: beacon-chain
      args:
        UPSTREAM_VERSION: v4.0.8
    volumes:
      - "beacon-chain-data:/data"
    ports:
      - "13103:13103/tcp"
      - "12103:12103/udp"
    restart: unless-stopped
    environment:
      P2P_TCP_PORT: 13103
      P2P_UDP_PORT: 12103
      CHECKPOINT_SYNC_URL: ""
      CORSDOMAIN: "http://prysm.dappnode"
      EXTRA_OPTS: ""
      FEE_RECIPIENT_ADDRESS: ""
  validator:
    image: "validator.prysm.dnp.dappnode.eth:2.0.0"
    build:
      context: validator
      args:
        UPSTREAM_VERSION: v4.0.8
    volumes:
      - "validator-data:/root/"
    restart: unless-stopped
    environment:
      LOG_TYPE: INFO
      BEACON_RPC_PROVIDER: "beacon-chain.prysm.dappnode:4000"
      BEACON_RPC_GATEWAY_PROVIDER: "beacon-chain.prysm.dappnode:3500"
      GRAFFITI: validating_from_DAppNode
      EXTRA_OPTS: ""
      FEE_RECIPIENT_ADDRESS: ""
volumes:
  beacon-chain-data: {}
  validator-data: {}
`;

const prysmManifest = `
{
    "name": "prysm.dnp.dappnode.eth",
    "version": "3.0.12",
    "upstreamVersion": "v4.0.8",
    "upstreamRepo": "prysmaticlabs/prysm",
    "upstreamArg": "UPSTREAM_VERSION",
    "shortDescription": "Prysm mainnet ETH2.0 Beacon chain + validator",
    "description": "Validate with Prysm: a Go implementation of the Ethereum 2.0 Serenity protocol and open source project created by Prysmatic Labs.\n\nIt includes a Grafana dashboard for the [DMS](http://my.dappnode/#/installer/dms.dnp.dappnode.eth) thanks to the amazing work of [metanull-operator](https://github.com/metanull-operator/eth2-grafana)",
    "type": "service",
    "architectures": ["linux/amd64"],
    "mainService": "validator",
    "author": "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
    "contributors": [
      "dappLion <dapplion@dappnode.io> (https://github.com/dapplion)"
    ],
    "chain": {
      "driver": "ethereum-beacon-chain",
      "serviceName": "beacon-chain",
      "portNumber": 3500
    },
    "license": "GPL-3.0",
    "repository": {
      "type": "git",
      "url": "git+https://github.com/dappnode/DAppNodePackage-prysm.git"
    },
    "bugs": {
      "url": "https://github.com/dappnode/DAppNodePackage-prysm/issues"
    },
    "requirements": {
      "minimumDappnodeVersion": "0.2.60"
    },
    "backup": [
      {
        "name": "eth2validators",
        "path": "/root/.eth2validators",
        "service": "validator"
      }
    ],
    "categories": ["Blockchain", "ETH2.0"],
    "style": {
      "featuredBackground": "linear-gradient(67deg, #16000c, #123939)",
      "featuredColor": "white"
    },
    "links": {
      "ui": "http://brain.web3signer.dappnode",
      "homepage": "https://prysmaticlabs.com/",
      "readme": "https://github.com/dappnode/DAppNodePackage-prysm",
      "docs": "https://docs.prylabs.network/docs/getting-started"
    },
    "warnings": {
      "onMajorUpdate": "This is a major update that enables multiclient validation on Mainnet.⚠️ BEFORE YOU START, MAKE SURE YOU HAVE A BACKUP OF THE VALIDATOR KEYS⚠️ . A new package, the web3signer, will be automatically installed and keys will be moved inside of this package. The web3signer will hold the keys and allow you to change validator clients safely. From now on, the UI to handle the keystores will be available at the web3signer package. You will be prompted to choose a validator client in the following steps; make sure you select one that is installed and synced (leave it as Prysm if you are not sure, you can change it later). Pay attention to the update and make sure the keystores are successfully relocated by checking the UI of the web3signer after the update.",
      "onRemove": "Make sure your StakersUI does not have this client selected! Double check in the Stakers Tab in the left NavBar"
    },
    "globalEnvs": [
      {
        "envs": ["EXECUTION_CLIENT_MAINNET", "MEVBOOST_MAINNET"],
        "services": ["beacon-chain"]
      },
      {
        "envs": ["MEVBOOST_MAINNET"],
        "services": ["validator"]
      }
    ]
  }
`;

beforeEach("Create docker compose and manifest", async () => {
  // Create necessary dir
  await shellSafe(`mkdir -p ${dnpPrysmPath}`);
  // Create example compose
  fs.writeFileSync(`${dnpPrysmPath}/docker-compose.yml`, prysmCompose);
  fs.writeFileSync(`${dnpPrysmPath}/dappnode_package.json`, prysmManifest);

});
before("Start the Prysm container", async () => {
    await shellSafe(`docker-compose -f ${dnpPrysmPath}/docker-compose.yml up -d`);

    // Let's assume that the beacon-chain service is the one you're focused on
    const containerName = "DAppNodePackage-beacon-chain.prysm.dnp.dappnode.eth";

    // Get the network the container is connected to
    const inspectOutput = await shellSafe(`docker inspect ${containerName}`);

    if (inspectOutput != null) {
        const containerDetails = JSON.parse(inspectOutput);
        const networkName = Object.keys(containerDetails[0].NetworkSettings.Networks)[0];
    
        // Disconnect the container from the network
        await shellSafe(`docker network disconnect ${networkName} ${containerName}`);
    
        // Reconnect the container to the network without any aliases
        await shellSafe(`docker network connect ${networkName} ${containerName}`);
        }

        await shellSafe(`docker inspect ${containerName}`);
    });

//   it("should handle no containers", async () => {
//     await addAliasToRunningContainers();
//     // Nothing specific to expect here since the list is empty.
//     // This just checks if the function doesn't throw any errors with an empty list.
//   });


//   it("should add alias to a single container", async () => {
//     utils.listContainers = async () => [{
//       containerName: 'container1',
//       dnpName: 'dnp1',
//       isCore: false,
//       isMain: true
//     }];
    
//     utils.getPrivateNetworkAlias = (container) => {
//       expect(container.containerName).to.equal('container1');
//       return 'someAlias';
//     };

//     let updatedContainerNetworkCalled = false;
//     utils.updateContainerNetwork = async (networkName, container, updatedConfig) => {
//       expect(networkName).to.exist;
//       expect(container.containerName).to.equal('container1');
//       expect(updatedConfig).to.exist;
//       updatedContainerNetworkCalled = true;
//     };

//     await addAliasToRunningContainers();

//     expect(updatedContainerNetworkCalled).to.equal(true, "updateContainerNetwork should have been called");
//   });

  // Further test cases should cover:
  // - The scenario where the alias already exists
  // - The scenario where the container is the main service of a multiservice package.
  // - Any error handling scenarios you'd like to cover
});

