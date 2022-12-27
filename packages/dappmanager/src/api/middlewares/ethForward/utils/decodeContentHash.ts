import { CID } from "multiformats/cid";
import multicodec from "multicodec";
import { Content } from "../types";
import { isEmpty } from "./isEmpty";

/**
 * Used in the CONTENTHASH_INTERFACE_ID = "0xbc1c58d1"
 * @param contenthash
 * @returns content
 */
export function decodeContentHash(contenthash: string): Content {
  if (isEmpty(contenthash)) throw TypeError(`Empty content hash`);

  const contentHashEncoded = Buffer.from(contenthash.slice(2), "hex");
  const contentCodec = multicodec.getNameFromData(contentHashEncoded);

  if (contentCodec.startsWith("ipfs")) {
    const value = multicodec.rmPrefix(contentHashEncoded);
    const cid = CID.decode(value);
    return {
      location: "ipfs",
      hash: cid.toV0().toString()
    };
  } else if (contentCodec.startsWith("swarm")) {
    const value = multicodec.rmPrefix(contentHashEncoded);
    const cid = CID.decode(value);

    return {
      location: "swarm",
      hash: Buffer.from(cid.multihash.digest).toString("hex")
    };
  } else {
    throw Error(`Unsupported coded: ${contentCodec}`);
  }
}
