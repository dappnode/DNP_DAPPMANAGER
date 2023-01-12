import { ethers } from "ethers";
import { base58btc } from "multiformats/bases/base58";
import { base32 } from "multiformats/bases/base32";
import { base64, base64url } from "multiformats/bases/base64";
import { ReleaseSignature } from "../../types";
import { releaseFiles } from "../../params";
import { ReleaseSignatureWithData } from "./types";
import { IPFSEntry } from "../ipfs";
import {
  TrustedReleaseKey,
  ReleaseSignatureStatus,
  ReleaseSignatureStatusCode,
  ReleaseSignatureProtocol
} from "@dappnode/common";
import { CID } from "ipfs-http-client";

export function getReleaseSignatureStatus(
  dnpName: string,
  signatureWithData: ReleaseSignatureWithData | undefined,
  trustedKeys: TrustedReleaseKey[]
): ReleaseSignatureStatus {
  if (!signatureWithData) {
    return { status: ReleaseSignatureStatusCode.notSigned };
  }

  const { signature, signedData } = signatureWithData;
  const signingKey = getReleaseSigningKey(
    signedData,
    signature.signature,
    signature.signature_protocol
  );

  for (const trustedKey of trustedKeys) {
    if (
      dnpName.endsWith(trustedKey.dnpNameSuffix) &&
      trustedKey.signatureProtocol === signature.signature_protocol &&
      trustedKey.key === signingKey
    ) {
      return {
        status: ReleaseSignatureStatusCode.signedByKnownKey,
        keyName: trustedKey.name
      };
    }
  }

  return {
    status: ReleaseSignatureStatusCode.signedByUnknownKey,
    signatureProtocol: signature.signature_protocol,
    key: signingKey
  };
}

export function getReleaseSigningKey(
  signedDataStr: string,
  signature: string,
  signatureProtocol: ReleaseSignatureProtocol
): string {
  switch (signatureProtocol) {
    case "ECDSA_256":
      return ethers.utils.verifyMessage(signedDataStr, signature);
    default:
      throw Error(`Unknown signature protocol ${signatureProtocol}`);
  }
}

/**
 * Example serializing `QmRhdmquYoiMR5GB2dKqhLipMzdFUeyZ2eSVvTLDvndTvh` with v0 base58btc
 *
 * ```
 * avatar.png zdj7WnZ4Yn4ev7T8qSACAjqnErfqfQsCPsfrHuJNKcaAp7PkJ
 * dappmanager.dnp.dappnode.eth_0.2.43_linux-amd64.txz zdj7WifbEQAjxvDftqcMBFPVexDu4SmMF66NkcoPJjtHv9HJQ
 * dappmanager.dnp.dappnode.eth_0.2.43_linux-arm64.txz zdj7WhMmCV4ZRJQ981bqsZd9Wcu6rSMqgSqx8fKJcnbmRhB5H
 * dappmanager.dnp.dappnode.eth_0.2.43.tar.xz zdj7WifbEQAjxvDftqcMBFPVexDu4SmMF66NkcoPJjtHv9HJQ
 * dappnode_package.json zdj7WbUmsj617EgJRysWqPpzJxriYfmBxBo1uhAv3kqq6k3VJ
 * docker-compose.yml zdj7Wf2pYesVyvSbcTEwWVd8TFtTjv588FET9L7qgkP47kRkf
 * ```
 */
export function serializeIpfsDirectory(
  files: IPFSEntry[],
  opts: ReleaseSignature["cid"]
): string {
  return (
    files
      .filter(file => !releaseFiles.signature.regex.test(file.name))
      // Sort alphabetically in descending order
      .sort((a, b) => a.name.localeCompare(b.name))
      /** `${name} ${cidStr}` */
      .map(file => {
        const cidStr = cidToString(
          getCidAtVersion(file.cid, opts.version),
          opts.base
        );
        return `${file.name} ${cidStr}`;
      })
      .join("\n")
  );
}

function getCidAtVersion(cid: CID, version: number): CID {
  switch (version) {
    case 0:
      return cid.toV0();
    case 1:
      return cid.toV1();
    default:
      throw Error(`Unknown CID version ${version}`);
  }
}

function cidToString(cid: CID, base: string): string {
  switch (base) {
    case "base58btc":
      return cid.toString(base58btc);
    case "base32":
      return cid.toString(base32);
    case "base64":
      return cid.toString(base64);
    case "base64url":
      return cid.toString(base64url);
    default:
      throw Error(`Unknown CID base ${base}`);
  }
}
