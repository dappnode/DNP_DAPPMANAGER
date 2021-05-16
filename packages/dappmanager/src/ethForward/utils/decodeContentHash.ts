import CID from "cids";
import multicodec from "multicodec";
import { Content } from "../types";
import { isEmpty } from "./isEmpty";
import multihash from "multihashes";

/**
 * Used in the CONTENTHASH_INTERFACE_ID = "0xbc1c58d1"
 * @param contenthash
 * @returns content
 */
export function decodeContentHash(contenthash: string): Content {
  if (isEmpty(contenthash)) throw TypeError(`Empty content hash`);

  const contentHashEncoded = Buffer.from(contenthash.slice(2), "hex");
  const contentCodec = multicodec.getCodec(contentHashEncoded);

  if (contentCodec.startsWith("ipfs")) {
    const value = multicodec.rmPrefix(contentHashEncoded);
    const cid = new CID(value);
    return {
      location: "ipfs",
      hash: multihash.toB58String(cid.multihash)
    };
  } else if (contentCodec.startsWith("ipns")) {
    const value = multicodec.rmPrefix(contentHashEncoded);
    // it's not clear that this is actually valid CID
    // eg uniswap.eth -> 12uA8M8Ku8mHUumxHcu7uee
    // not a Qm... hash
    const cid = new CID(value);
    return {
      location: "ipns",
      hash: multihash.toB58String(cid.multihash)
    };
  } else if (contentCodec.startsWith("swarm")) {
    const value = multicodec.rmPrefix(contentHashEncoded);
    const cid = new CID(value);
    return {
      location: "swarm",
      hash: Buffer.from(multihash.decode(cid.multihash).digest).toString("hex")
    };
  } else {
    throw Error(`Unsupported codec: ${contentCodec}`);
  }
}
