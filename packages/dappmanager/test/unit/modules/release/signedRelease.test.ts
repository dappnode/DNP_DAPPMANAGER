import "mocha";
import { CID } from "ipfs-http-client";
import { ethers } from "ethers";
import { expect } from "chai";

import {
  serializeIpfsDirectory,
  getReleaseSignatureStatus
} from "../../../../src/modules/release/releaseSignature";
import { IPFSEntry } from "../../../../src/modules/ipfs";
import { ReleaseSignature } from "../../../../src/types";
import {
  ReleaseSignatureStatusCode,
  TrustedReleaseKey
} from "@dappnode/common";

describe("modules / release / verifyReleaseSignature", () => {
  const files: IPFSEntry[] = [
    {
      name: "avatar.png",
      hash: "QmfTpBLzoSdrG88ETRnDus27DTDRUrTXyyVmhXDuMNYVaN"
    },
    {
      name: "dappmanager.dnp.dappnode.eth_0.2.43.tar.xz",
      hash: "QmbaLry6tVScoBXgcSHmdH7fGrFKdhfxWSDGiWMDUUaP8U"
    },
    {
      name: "dappmanager.dnp.dappnode.eth_0.2.43_linux-amd64.txz",
      hash: "QmbaLry6tVScoBXgcSHmdH7fGrFKdhfxWSDGiWMDUUaP8U"
    },
    {
      name: "dappmanager.dnp.dappnode.eth_0.2.43_linux-arm64.txz",
      hash: "QmaGWq3zhwpoGQhg78c1H8nLUeEv892i5pFndpPvwz8GuM"
    },
    {
      name: "dappnode_package.json",
      hash: "QmUPXWJ29dm5Rifwn6SD7w8J6LUKUQmf9bHeFFNB1fB9KN"
    },
    {
      name: "signature.json",
      hash: "QmaonPyyb1N74GiPJLUjQ7E6sepmSSRi5VgSaZnn3YP16x"
    }
  ].map(file => ({
    name: file.name,
    path: "QmRhdmquYoiMR5GB2dKqhLipMzdFUeyZ2eSVvTLDvndTvh/-----------",
    size: 1000,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cid: CID.parse(file.hash),
    type: "file",
    depth: 1
  }));

  it("serialize ipfs directory v0 base58btc", () => {
    const serializedExpected = `avatar.png QmfTpBLzoSdrG88ETRnDus27DTDRUrTXyyVmhXDuMNYVaN
dappmanager.dnp.dappnode.eth_0.2.43_linux-amd64.txz QmbaLry6tVScoBXgcSHmdH7fGrFKdhfxWSDGiWMDUUaP8U
dappmanager.dnp.dappnode.eth_0.2.43_linux-arm64.txz QmaGWq3zhwpoGQhg78c1H8nLUeEv892i5pFndpPvwz8GuM
dappmanager.dnp.dappnode.eth_0.2.43.tar.xz QmbaLry6tVScoBXgcSHmdH7fGrFKdhfxWSDGiWMDUUaP8U
dappnode_package.json QmUPXWJ29dm5Rifwn6SD7w8J6LUKUQmf9bHeFFNB1fB9KN`;

    const serialized = serializeIpfsDirectory(files, {
      version: 0,
      base: "base58btc"
    });
    expect(serialized).to.equal(serializedExpected);
  });

  it("serialize ipfs directory v1 base32", () => {
    const serializedExpected = `avatar.png bafybeih6nrzwkr7v3ogs7pevdeorxr72rqp6tla7j46qbpfzjmmifndge4
dappmanager.dnp.dappnode.eth_0.2.43_linux-amd64.txz bafybeigevhq2onf5oymh5opcucxcfhrh2az6pgefmhgev47hlesocwq2qe
dappmanager.dnp.dappnode.eth_0.2.43_linux-arm64.txz bafybeifrhubhsarxj3dswuk65ig6znoowcro33irxeuxmcziallj2xp5ua
dappmanager.dnp.dappnode.eth_0.2.43.tar.xz bafybeigevhq2onf5oymh5opcucxcfhrh2az6pgefmhgev47hlesocwq2qe
dappnode_package.json bafybeicz4k4adz7g6ketn6ogv2ot7hvklfgv6ovtjrzq24ez7urphanmhe`;

    const serialized = serializeIpfsDirectory(files, {
      version: 1,
      base: "base32"
    });
    expect(serialized).to.equal(serializedExpected);
  });

  it("Verify release signature with ECDSA_256", async () => {
    const cidOpts: ReleaseSignature["cid"] = { version: 0, base: "base58btc" };
    const signedData = serializeIpfsDirectory(files, cidOpts);

    const privateKey =
      "0x0123456789012345678901234567890123456789012345678901234567890123";
    const wallet = new ethers.Wallet(privateKey);

    // Sign the string message

    const flatSig = await wallet.signMessage(signedData);

    const signature: ReleaseSignature = {
      version: 1,
      cid: cidOpts,
      signature_protocol: "ECDSA_256",
      signature: flatSig
    };

    const dnpName = "dappmanager.dnp.dappnode.eth";

    const trustedKey: TrustedReleaseKey = {
      name: "DAppNode association",
      signatureProtocol: "ECDSA_256",
      dnpNameSuffix: ".dnp.dappnode.eth",
      key: wallet.address
    };

    const signatureStatus = getReleaseSignatureStatus(
      dnpName,
      { signature, signedData },
      [trustedKey]
    );

    expect(signatureStatus).to.deep.equal({
      status: ReleaseSignatureStatusCode.signedByKnownKey,
      keyName: trustedKey.name
    });
  });
});
