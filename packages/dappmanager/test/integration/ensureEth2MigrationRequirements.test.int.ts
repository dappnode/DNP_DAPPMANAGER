import "mocha";
import { expect } from "chai";
import {
  ensureEth2MigrationRequirements,
  ensureNotInstallOtherClientIfPrysmLegacyIsInstalled,
  ensureNotInstallWeb3signerIfPrysmLegacyIsInstalled
} from "../../src/modules/installer/ensureEth2MigrationRequirements.js";
import { mockPackageData, shellSafe } from "../testUtils.js";
import params from "../../src/params.js";

describe("ensureEth2MigrationRequirements", () => {
  const networkName = "dncore_network";
  const prysmLegacyContainerName =
    "DAppNodePackage-gnosis-beacon-chain-prysm.dnp.dappnode.eth";
  const prysmGnosisSpecs = params.prysmLegacySpecs[1];

  before(async () => {
    await shellSafe(`docker network create ${networkName}`);
    await shellSafe(
      `docker run --name=${prysmLegacyContainerName} --network=${networkName} --label dappnode.dnp.version=0.1.6 -it -d --entrypoint='/bin/bash' debian:bullseye-slim`
    );
  });

  it("Should not throw any error when installing a random package", async () => {
    await ensureEth2MigrationRequirements([mockPackageData]);
  });

  it("Should not throw any error when installing a non-legacy Prysm package", async () => {
    await ensureEth2MigrationRequirements([
      {
        ...mockPackageData,
        dnpName: "gnosis-beacon-chain-prysm.dnp.dappnode.eth",
        semVersion: "1.0.0"
      }
    ]);
  });

  it("Should throw an error when installing Prysm legacy ", async () => {
    const err = await ensureEth2MigrationRequirements([
      {
        ...mockPackageData,
        dnpName: "gnosis-beacon-chain-prysm.dnp.dappnode.eth",
        semVersion: "0.1.6"
      }
    ]).catch(err => err);

    expect(err.message).to.equal(
      `Eth2 migration requirements failed: gnosis-beacon-chain-prysm.dnp.dappnode.eth:0.1.6 is a legacy validator client, install a more recent version with remote signer support`
    );
  });

  it("Should throw an error when installing web3signer and Prysm legacy is installed", async () => {
    const err = await ensureNotInstallWeb3signerIfPrysmLegacyIsInstalled(
      prysmGnosisSpecs,
      {
        ...mockPackageData,
        dnpName: "web3signer-gnosis.dnp.dappnode.eth"
      }
    ).catch(err => err);

    expect(err.message).to.equal(
      `Not allowed to install web3signer-gnosis.dnp.dappnode.eth having Prysm legacy client installed gnosis-beacon-chain-prysm.dnp.dappnode.eth:0.1.6. Update it or remove it`
    );
  });

  it("Should throw an error when installing any client and Prysm legacy is installed", async () => {
    const err = await ensureNotInstallOtherClientIfPrysmLegacyIsInstalled(
      prysmGnosisSpecs,
      {
        ...mockPackageData,
        dnpName: "teku-gnosis.dnp.dappnode.eth"
      }
    ).catch(err => err);

    expect(err.message).to.equal(
      `Not allowed to install client teku-gnosis.dnp.dappnode.eth having Prysm legacy client installed: gnosis-beacon-chain-prysm.dnp.dappnode.eth:0.1.6. Update it or remove it`
    );
  });

  it("Should not throw an error when installing web3signer and it is an update of Prysm and Prysm legacy is installed", async () => {
    await ensureEth2MigrationRequirements([
      {
        ...mockPackageData,
        dnpName: "gnosis-beacon-chain-prysm.dnp.dappnode.eth",
        semVersion: "1.0.0"
      },
      {
        ...mockPackageData,
        dnpName: "web3signer-gnosis.dnp.dappnode.eth"
      }
    ]);
  });

  after(async () => {
    await shellSafe(`docker rm -f ${prysmLegacyContainerName}`);
    await shellSafe(`docker network rm ${networkName}`);
  });
});
