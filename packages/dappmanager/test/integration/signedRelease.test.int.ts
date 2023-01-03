import { expect } from "chai";
import { ethers } from "ethers";
import { ComposeEditor } from "../../src/modules/compose/editor";
import { ipfs } from "../../src/modules/ipfs";
import { ReleaseFetcher } from "../../src/modules/release";
import { getContainerName, getImageTag } from "../../src/params";
import { ReleaseSignatureStatusCode } from "@dappnode/common";
import { Manifest } from "@dappnode/dappnodesdk";
import { uploadDirectoryRelease } from "./integrationSpecs";
import { signRelease } from "./integrationSpecs/signRelease";

// Sign the string message
const privateKey =
  "0x0111111111111111111111111111111111111111111111111111111111111111";

describe("Sign release", () => {
  it("Sign uploaded release", async () => {
    const dnpName = "test.dnp.dappnode.eth";
    const version = "1.0.0";

    const mainDnpManifest: Manifest = {
      name: dnpName,
      version,
      description: "Main DNP",
      type: "service",
      license: "GPL-3.0"
    };

    const composeMain = new ComposeEditor({
      version: "3.5",
      services: {
        [dnpName]: {
          container_name: getContainerName({
            dnpName: dnpName,
            serviceName: dnpName,
            isCore: false
          }),
          image: getImageTag({
            dnpName: dnpName,
            serviceName: dnpName,
            version
          })
        }
      }
    });

    // Create release
    const dnpReleaseHash = await uploadDirectoryRelease({
      manifest: mainDnpManifest,
      compose: composeMain.output()
    });

    const wallet = new ethers.Wallet(privateKey);
    const newReleaseHash = await signRelease(wallet, ipfs, dnpReleaseHash);

    const releaseFetcher = new ReleaseFetcher();
    const mainRelease = await releaseFetcher.getRelease(newReleaseHash);

    const expectedSignatureStatus: typeof mainRelease.signatureStatus = {
      status: ReleaseSignatureStatusCode.signedByUnknownKey,
      signatureProtocol: "ECDSA_256",
      key: wallet.address
    };
    expect(mainRelease.signatureStatus).to.deep.equal(expectedSignatureStatus);
  });
});
