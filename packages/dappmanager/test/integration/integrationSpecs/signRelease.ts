import { ethers } from "ethers";
import { CID } from "ipfs-http-client";
import { sortBy } from "lodash-es";
import { Ipfs } from "../../../src/modules/ipfs/Ipfs";
import { serializeIpfsDirectory } from "../../../src/modules/release/releaseSignature";
import { ReleaseSignature } from "../../../src/types";

const signatureFilename = "signature.json";

export async function signRelease(
  wallet: ethers.Wallet,
  ipfs: Ipfs,
  dnpReleaseHash: string
): Promise<string> {
  const releaseFiles = await ipfs.list(dnpReleaseHash);

  const cidOpts: ReleaseSignature["cid"] = { version: 0, base: "base58btc" };
  const signedData = serializeIpfsDirectory(releaseFiles, cidOpts);

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
    Name: signatureFilename,
    Tsize: signatureIpfsEntry.size
  });

  // DAG-PB form (links must be sorted by Name bytes)
  getRes.value.Links = sortBy(getRes.value.Links, ["Name", "Tsize"]);

  const newReleaseCid = await ipfs.ipfs.dag.put(getRes.value, {
    storeCodec: "dag-pb",
    hashAlg: "sha2-256"
  });

  // Validate that the new release hash contains all previous files + signature
  const newReleaseFiles = await ipfs.list(newReleaseCid.toString());
  const filesNamesStr = serializeDir(newReleaseFiles.map(file => file.name));
  const expectedFns = serializeDir([
    ...releaseFiles.map(file => file.name),
    signatureFilename
  ]);
  if (filesNamesStr !== expectedFns) {
    throw Error(
      `Wrong files in new release: ${filesNamesStr} - expected: ${expectedFns}`
    );
  }

  return newReleaseCid.toV0().toString();
}

export interface IpfsDagPbValue {
  Data: Uint8Array;
  Links: {
    Hash: CID;
    /** "dappnode_package.json" */
    Name: string;
    /** 67 */
    Tsize: number;
  }[];
}

export interface IpfsDagGetResult<V> {
  /**
   * The value or node that was fetched during the get operation
   */
  value: V;

  /**
   * The remainder of the Path that the node was unable to resolve or what was left in a localResolve scenario
   */
  remainderPath?: string;
}

function serializeDir(filenames: string[]): string {
  return filenames.sort().join(", ");
}
