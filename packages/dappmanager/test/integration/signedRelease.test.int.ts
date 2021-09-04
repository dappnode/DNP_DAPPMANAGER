import { expect } from "chai";
import { ethers } from "ethers";
import { CID } from "ipfs-http-client";
import sortBy from "lodash/sortBy";
import { ComposeEditor } from "../../src/modules/compose/editor";
import { ipfs } from "../../src/modules/ipfs";
import { ReleaseFetcher } from "../../src/modules/release";
import { serializeIpfsDirectory } from "../../src/modules/release/releaseSignature";
import { getContainerName, getImageTag } from "../../src/params";
import {
  ReleaseSignature,
  Manifest,
  ReleaseSignatureStatus,
  ReleaseSignatureStatusCode
} from "../../src/types";
import { uploadDirectoryRelease } from "../integrationSpecs";

describe("Sign release", () => {
  it("Sign uploaded release", async () => {
    const dnpName = "test.dnp.dappnode.eth";
    const version = "1.0.0";

    const mainDnpManifest: Manifest = {
      name: dnpName,
      version
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

    const releaseFiles = await ipfs.ls(dnpReleaseHash);

    const cidOpts: ReleaseSignature["cid"] = { version: 0, base: "base58btc" };
    const signedData = serializeIpfsDirectory(releaseFiles, cidOpts);

    // Sign the string message
    const privateKey =
      "0x0123456789012345678901234567890123456789012345678901234567890123";
    const wallet = new ethers.Wallet(privateKey);
    const flatSig = await wallet.signMessage(signedData);

    const signature: ReleaseSignature = {
      version: 1,
      cid: cidOpts,
      signature_protocol: "ECDSA_256",
      signature: flatSig
    };

    const signatureIpfsEntry = await ipfs.ipfs.add(
      JSON.stringify(signature, null, 2)
    );

    const getRes: IpfsDagGetResult<IpfsDagPbValue> = await ipfs.ipfs.dag.get(
      CID.parse(dnpReleaseHash)
    );

    // Mutate dag-pb value appending a new Link
    // TODO: What happens if the block becomes too big
    getRes.value.Links.push({
      Hash: signatureIpfsEntry.cid,
      Name: "signature.json",
      Tsize: signatureIpfsEntry.size
    });

    // DAG-PB form (links must be sorted by Name bytes)
    getRes.value.Links = sortBy(getRes.value.Links, ["Name", "Tsize"]);

    const newReleaseCid = await ipfs.ipfs.dag.put(getRes.value, {
      format: "dag-pb",
      hashAlg: "sha2-256"
    });

    // Validate that the new release hash contains all previous files + signature
    const newReleaseFiles = await ipfs.ls(newReleaseCid);
    expect(newReleaseFiles.map(file => file.name).sort()).to.deep.equal(
      [...releaseFiles.map(file => file.name), "signature.json"].sort(),
      "Wrong files in new release"
    );

    const newReleaseHash = newReleaseCid.toV0().toString();

    const releaseFetcher = new ReleaseFetcher();
    const mainRelease = await releaseFetcher.getRelease(newReleaseHash);

    const expectedSignatureStatus: ReleaseSignatureStatus = {
      status: ReleaseSignatureStatusCode.signedByUnknownKey,
      signatureProtocol: "ECDSA_256",
      key: wallet.address
    };
    expect(mainRelease.signatureStatus).to.deep.equal(expectedSignatureStatus);
  });
});

interface IpfsDagPbValue {
  Data: Uint8Array;
  Links: {
    Hash: CID;
    /** "dappnode_package.json" */
    Name: string;
    /** 67 */
    Tsize: number;
  }[];
}

interface IpfsDagGetResult<V> {
  /**
   * The value or node that was fetched during the get operation
   */
  value: V;

  /**
   * The remainder of the Path that the node was unable to resolve or what was left in a localResolve scenario
   */
  remainderPath?: string;
}
