import { expect } from "chai";
import { getPrysmOldValidatorImage } from "../../../../../packages/dappmanager/src/modules/eth2migration/utils";
import { DockerImageInfo } from "../../../src/modules/docker/api/listImages";
import { parseValidatorPubkeysHexFromListOutput } from "../../../src/modules/eth2migration/export/exportKeystoresAndSlashingProtection";

describe("eth2migration / utils", () => {
  it("Should parse validator accounts list", () => {
    const validatorAccountsData = `[2021-12-15 11:38:36]  WARN flags: Running on Ethereum Consensus Mainnet
(keymanager kind) imported wallet

Showing 2 validator accounts
View the eth1 deposit transaction data for your accounts by running \`validator accounts list --show-deposit-data\`

Account 0 | definitely-evolving-honeybee
[validating public key] 0x80b11b83eb8c1858c657dc55936bd4b47d2418c8906777cecae9c14495796f3d52b44652684e25e9ebb3e9efcfea33c6

Account 1 | implicitly-ultimate-emu
[validating public key] 0x8ac669f5180ae1de36db123114657437fd2cd3f51e838aa327d6739ff28907731462e0832fb9eb190972cfd652b2a775
`;

    const expectedValidatorAccounts = [
      "0x80b11b83eb8c1858c657dc55936bd4b47d2418c8906777cecae9c14495796f3d52b44652684e25e9ebb3e9efcfea33c6",
      "0x8ac669f5180ae1de36db123114657437fd2cd3f51e838aa327d6739ff28907731462e0832fb9eb190972cfd652b2a775"
    ];

    expect(
      parseValidatorPubkeysHexFromListOutput(validatorAccountsData)
    ).to.deep.equal(expectedValidatorAccounts);
  });

  it("Should get old validator image", async () => {
    const dockerImages: DockerImageInfo[] = [
      {
        Containers: -1,
        Created: 1643803358,
        Id: "sha256:235d672776e67e09bcb4fffe864216c8e7887e6fafd6ca24a214b2c6fa3142b1",
        Labels: {
          "org.label-schema.build-date": "2022-01-04T06:27Z",
          "org.label-schema.description": "Ethereum 2.0 Signing Service",
          "org.label-schema.name": "Web3Signer",
          "org.label-schema.schema-version": "1.0",
          "org.label-schema.url": "https://docs.web3signer.consensys.net",
          "org.label-schema.vcs-ref": "8d019c42",
          "org.label-schema.vcs-url":
            "https://github.com/ConsenSys/web3signer.git",
          "org.label-schema.vendor": "ConsenSys",
          "org.label-schema.version": "21.10.5"
        },
        ParentId: "",
        RepoDigests: ["<none>@<none>"],
        RepoTags: ["<none>:<none>"],
        SharedSize: -1,
        Size: 399880869,
        VirtualSize: 399880869
      },
      {
        Containers: -1,
        Created: 1643801397,
        Id: "sha256:aeaa6b7857762d41db5e0966f2844ae915aafce58235602bab554f536375f644",
        Labels: null,
        ParentId: "",
        RepoDigests: null,
        RepoTags: ["postgres.web3signer.dnp.dappnode.eth:0.1.0"],
        SharedSize: -1,
        Size: 946295795,
        VirtualSize: 946295795
      },
      {
        Containers: -1,
        Created: 1643800749,
        Id: "sha256:882a991bf36bcc2ead8eae8d41aef7eda8d7f5f7548aa3a3144c0305925578ef",
        Labels: {
          "org.label-schema.build-date": "2022-01-27T23:09Z",
          "org.label-schema.description": "Ethereum 2.0 Beacon Chain Client",
          "org.label-schema.name": "Teku",
          "org.label-schema.schema-version": "1.0",
          "org.label-schema.url":
            "https://consensys.net/knowledge-base/ethereum-2/teku/",
          "org.label-schema.vcs-ref": "66484861",
          "org.label-schema.vcs-url": "https://github.com/ConsenSys/teku.git",
          "org.label-schema.vendor": "ConsenSys",
          "org.label-schema.version": "22.1.1"
        },
        ParentId: "",
        RepoDigests: ["<none>@<none>"],
        RepoTags: ["<none>:<none>"],
        SharedSize: -1,
        Size: 370321408,
        VirtualSize: 370321408
      },
      {
        Containers: -1,
        Created: 1643703266,
        Id: "sha256:f214cf9544ca5e0078082e629b7a2181d14a5cbc6df22a85d64ea06141a1bedb",
        Labels: null,
        ParentId: "",
        RepoDigests: null,
        RepoTags: ["beacon-chain.prysm-prater.dnp.dappnode.eth:0.1.7"],
        SharedSize: -1,
        Size: 174829283,
        VirtualSize: 174829283
      },
      {
        Containers: -1,
        Created: 1643703260,
        Id: "sha256:f4441c6beff4ec2b067e46f8915803a35e1bc95119391ea90ca7254a3df411d7",
        Labels: null,
        ParentId: "",
        RepoDigests: null,
        RepoTags: ["validator.prysm-prater.dnp.dappnode.eth:0.1.7"],
        SharedSize: -1,
        Size: 212648172,
        VirtualSize: 212648172
      },
      {
        Containers: -1,
        Created: 1642458308,
        Id: "sha256:23a3b8cb0b26d91b57f0f6cbba65b9757eda19a91f000014960ecc2526d3c185",
        Labels: null,
        ParentId: "",
        RepoDigests: null,
        RepoTags: ["openethereum-gnosis-chain.dnp.dappnode.eth:0.1.3"],
        SharedSize: -1,
        Size: 38482480,
        VirtualSize: 38482480
      },
      {
        Containers: -1,
        Created: 1642184684,
        Id: "sha256:b8fa35bb0ea7a0d46e97eaedd21519994c8dd03cbb54620b14f34f80b17c2b21",
        Labels: { maintainer: "Rotki Solutions GmbH <info@rotki.com>" },
        ParentId: "",
        RepoDigests: null,
        RepoTags: ["rotki.dnp.dappnode.eth:0.1.9"],
        SharedSize: -1,
        Size: 197869711,
        VirtualSize: 197869711
      }
    ];

    const prysmOldValidatorImage = getPrysmOldValidatorImage({
      dockerImages,
      prysmOldDnpName: "prysm-prater.dnp.dappnode.eth",
      prysmOldStableVersion: "0.1.7"
    });

    expect(prysmOldValidatorImage).to.deep.equal(
      "validator.prysm-prater.dnp.dappnode.eth:0.1.7"
    );
  });
});
