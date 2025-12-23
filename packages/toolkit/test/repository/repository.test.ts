import { expect } from "chai";
import { DappnodeRepository } from "../../src/repository/index.js";
import { cleanTestDir, testDir } from "../testUtils.js";
import path from "path";
import fs from "fs";
import { createHash } from "crypto";
import { ReleaseSignatureStatusCode, TrustedReleaseKey } from "@dappnode/types";
import { ethers } from "ethers";

describe.skip("Dappnode Repository", function () {
  const ipfsUrls = [
    //"https://api.ipfs.dappnode.io",
    "https://ipfs-gateway.dappnode.net"
  ];

  const prysmDnpName = "prysm.dnp.dappnode.eth";
  const prysmVersion = "3.0.8";
  const dappnodeTrustedKey: TrustedReleaseKey = {
    name: "DAppNode Association",
    signatureProtocol: "ECDSA_256",
    dnpNameSuffix: ".dnp.dappnode.eth",
    key: "0xF35960302a07022aBa880DFFaEC2Fdd64d5BF1c1"
  };

  before(() => {
    cleanTestDir();
  });

  for (const ipfsUrl of ipfsUrls) {
    this.timeout(100000);
    const contract = new DappnodeRepository(
      ipfsUrl,
      new ethers.InfuraProvider("mainnet", process.env.INFURA_MAINNET_KEY)
    );

    it(`[${ipfsUrl}] Should get and validate package version for Prysm:${prysmVersion}`, async () => {
      const expectedVersionAndIpfsHash = {
        version: "3.0.8",
        contentUri: "/ipfs/QmZrZeQwMBBfSb6FQUcKdnB9epGmUzqarmkw2RbwTVQgbZ"
      };
      const result = await contract.getVersionAndIpfsHash({
        dnpNameOrHash: prysmDnpName,
        version: prysmVersion
      });
      expect(result).to.deep.equal(expectedVersionAndIpfsHash);
    });

    it(`[${ipfsUrl}] Should get and validate package release for Prysm:${prysmVersion}`, async () => {
      const expectedImageFile = {
        hash: "QmWcJrobqhHF7GWpqEbxdv2cWCCXbACmq85Hh7aJ1eu8rn",
        size: 64461521,
        source: "ipfs"
      };
      const expectedAvatarFile = {
        hash: "QmeZBTEAf3bXJreBECaMhHa53bhCPqvSwVng8q1UnPoL4L",
        size: 4303,
        source: "ipfs"
      };
      const expectedManifest = {
        name: "prysm.dnp.dappnode.eth",
        version: "3.0.8",
        upstreamVersion: "v4.0.2",
        upstreamRepo: "prysmaticlabs/prysm",
        upstreamArg: "UPSTREAM_VERSION",
        shortDescription: "Prysm mainnet ETH2.0 Beacon chain + validator",
        description:
          "Validate with Prysm: a Go implementation of the Ethereum 2.0 Serenity protocol and open source project created by Prysmatic Labs.\n" +
          "\n" +
          "It includes a Grafana dashboard for the [DMS](http://my.dappnode/#/installer/dms.dnp.dappnode.eth) thanks to the amazing work of [metanull-operator](https://github.com/metanull-operator/eth2-grafana)",
        type: "service",
        architectures: ["linux/amd64"],
        mainService: "validator",
        author: "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
        contributors: ["dappLion <dapplion@dappnode.io> (https://github.com/dapplion)"],
        chain: {
          driver: "ethereum-beacon-chain",
          serviceName: "beacon-chain",
          portNumber: 3500
        },
        license: "GPL-3.0",
        repository: {
          type: "git",
          url: "git+https://github.com/dappnode/DAppNodePackage-prysm.git"
        },
        bugs: {
          url: "https://github.com/dappnode/DAppNodePackage-prysm/issues"
        },
        requirements: { minimumDappnodeVersion: "0.2.60" },
        backup: [
          {
            name: "eth2validators",
            path: "/root/.eth2validators",
            service: "validator"
          }
        ],
        categories: ["Blockchain", "ETH2.0"],
        style: {
          featuredBackground: "linear-gradient(67deg, #16000c, #123939)",
          featuredColor: "white"
        },
        links: {
          ui: "http://brain.web3signer.dappnode",
          homepage: "https://prysmaticlabs.com/",
          readme: "https://github.com/dappnode/DAppNodePackage-prysm",
          docs: "https://docs.prylabs.network/docs/getting-started"
        },
        warnings: {
          onMajorUpdate:
            "This is a major update that enables multiclient validation on Mainnet.⚠️ BEFORE YOU START, MAKE SURE YOU HAVE A BACKUP OF THE VALIDATOR KEYS⚠️ . A new package, the web3signer, will be automatically installed and keys will be moved inside of this package. The web3signer will hold the keys and allow you to change validator clients safely. From now on, the UI to handle the keystores will be available at the web3signer package. You will be prompted to choose a validator client in the following steps; make sure you select one that is installed and synced (leave it as Prysm if you are not sure, you can change it later). Pay attention to the update and make sure the keystores are successfully relocated by checking the UI of the web3signer after the update.",
          onRemove:
            "Make sure your StakersUI does not have this client selected! Double check in the Stakers Tab in the left NavBar"
        },
        globalEnvs: [
          {
            envs: ["EXECUTION_CLIENT_MAINNET", "MEVBOOST_MAINNET"],
            services: ["beacon-chain"]
          },
          { envs: ["MEVBOOST_MAINNET"], services: ["validator"] }
        ]
      };
      const expectedCompose = {
        version: "3.4",
        services: {
          "beacon-chain": {
            environment: {
              CHECKPOINT_SYNC_URL: "",
              CORSDOMAIN: "http://prysm.dappnode",
              EXTRA_OPTS: "",
              FEE_RECIPIENT_ADDRESS: "",
              P2P_TCP_PORT: 13103,
              P2P_UDP_PORT: 12103
            },
            image: "beacon-chain.prysm.dnp.dappnode.eth:3.0.8",
            ports: ["13103:13103/tcp", "12103:12103/udp"],
            restart: "unless-stopped",
            volumes: ["beacon-chain-data:/data"]
          },
          validator: {
            environment: {
              BEACON_RPC_GATEWAY_PROVIDER: "beacon-chain.prysm.dappnode:3500",
              BEACON_RPC_PROVIDER: "beacon-chain.prysm.dappnode:4000",
              EXTRA_OPTS: "",
              FEE_RECIPIENT_ADDRESS: "",
              GRAFFITI: "validating_from_DAppNode",
              LOG_TYPE: "INFO"
            },
            image: "validator.prysm.dnp.dappnode.eth:3.0.8",
            restart: "unless-stopped",
            volumes: ["validator-data:/root/"]
          }
        },
        volumes: { "beacon-chain-data": {}, "validator-data": {} }
      };

      const expectedSignature = {
        version: 1,
        cid: { version: 0, base: "base58btc" },
        signature_protocol: "ECDSA_256",
        signature:
          "0x05df9a6449ac5fcbcaf98ee50cb5d40b08b797063058ee22dea5eff6fe493ef15a927f81132a80a94f43b5b35fe73662d4cbc2bc371c97a77683df3a0565fa821c"
      };

      const pkgRelease = await contract.getPkgRelease({
        dnpNameOrHash: prysmDnpName,
        trustedKeys: [dappnodeTrustedKey],
        version: prysmVersion,
        os: "x64"
      });

      console.log(pkgRelease.signedSafe);
      console.log(pkgRelease.signatureStatus.status);
      // expected files exist
      expect(expectedSignature).to.deep.equal(pkgRelease.signature);
      expect(pkgRelease.manifest).to.deep.equal(expectedManifest);
      expect(pkgRelease.compose).to.deep.equal(expectedCompose);
      expect(pkgRelease.imageFile).to.deep.equal(expectedImageFile);
      expect(pkgRelease.avatarFile).to.deep.equal(expectedAvatarFile);
      // expected to be signed
      expect(pkgRelease.signedSafe).to.be.true;
      // expected to be signed by a known key
      expect(pkgRelease.signatureStatus.status === ReleaseSignatureStatusCode.signedByKnownKey);
    });

    it(`[${ipfsUrl}] Should get multiple pkgs releases: `, async () => {
      const pkgReleases = await contract.getPkgsReleases(
        {
          [prysmDnpName]: prysmVersion,
          "lodestar.dnp.dappnode.eth": "0.1.0",
          "geth.dnp.dappnode.eth": "0.1.40",
          "swarm.public.dappnode.eth": "1.0.17"
        },
        [dappnodeTrustedKey],
        "x64"
      );
      expect(pkgReleases).to.be.ok;
    });

    it(`[${ipfsUrl}] Should write avatar file to filesystem and verify its hash`, async () => {
      const expectedHash = "c69e3bdc66446d32c1ed91f3d2e5a4e56ccde571668c85e15a23ef3613c31cb8";
      const avatarFileName = "avatar.png";
      const avatarFileExample = {
        hash: "QmeZBTEAf3bXJreBECaMhHa53bhCPqvSwVng8q1UnPoL4L",
        size: 4303,
        source: "ipfs"
      };

      await contract.writeFileToFs({
        hash: avatarFileExample.hash,
        path: path.join(testDir, avatarFileName),
        fileSize: avatarFileExample.size
      });

      const buffer = fs.readFileSync(path.join(testDir, avatarFileName));
      const hash = createHash("sha256").update(buffer).digest("hex");
      expect(hash).to.equal(expectedHash);
    });

    it(`[${ipfsUrl}] Should write docker image file to filesystem and verify its hash`, async () => {
      const expectedHash = "1f838c82a415bf82fa98171206f25827dd4cb93234bbf24b58969cd6ef2df159";
      const dockerImageFileName = "prysm.dnp.dappnode.eth_3.0.8_linux-amd64.txz";
      const dockerImageFileExample = {
        hash: "QmWcJrobqhHF7GWpqEbxdv2cWCCXbACmq85Hh7aJ1eu8rn",
        size: 64461521,
        source: "ipfs"
      };

      await contract.writeFileToFs({
        hash: dockerImageFileExample.hash,
        path: path.join(testDir, dockerImageFileName),
        fileSize: dockerImageFileExample.size
      });

      const buffer = fs.readFileSync(path.join(testDir, dockerImageFileName));
      const hash = createHash("sha256").update(buffer).digest("hex");
      expect(hash).to.equal(expectedHash);
    });
  }
});
