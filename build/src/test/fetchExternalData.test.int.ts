import "mocha";
import { expect } from "chai";
import * as calls from "../src/calls";
import { Manifest } from "../src/types";
import { clearDbs } from "./testUtils";

describe("Fetch external release data", () => {
  before(async () => {
    clearDbs();
  });

  const bindId = "bind.dnp.dappnode.eth";
  const bitcoinId = "bitcoin.dnp.dappnode.eth";
  let bindManifest: Manifest | undefined;
  let bitcoinManifest: Manifest | undefined;

  it("Should fetch core update data", async () => {
    const { result } = await calls.fetchCoreUpdateData({});
    expect(result.available).to.equal(true, "Core update should be available");
    const dnpBind = result.packages.find(({ name }) => name === bindId);
    expect(Boolean(dnpBind)).to.equal(
      true,
      "Bind DNP must be in packages array"
    );
  }).timeout(60 * 1000);

  it("Should fetch directory data", async () => {
    const { result } = await calls.fetchDirectory();
    expect(result).to.have.length.greaterThan(
      0,
      "There should be packages in the directory return"
    );
    const dnpBitcoin = result.find(({ name }) => name === bitcoinId);
    if (!dnpBitcoin) throw Error("No BITCOIN DNP found in directory array");
    expect(Boolean(dnpBitcoin)).to.equal(
      true,
      "Bitcoin DNP should be in directory array"
    );
    expect(dnpBitcoin.manifest).to.be.an(
      "object",
      "No manifest on bitcoin DNP"
    );
    expect(dnpBitcoin.avatar).to.be.a("string", "No avatar on bitcoin DNP");
    expect(dnpBitcoin.avatar).to.include(
      "data:image/png;base64",
      "Wrong avatar in bitcoin DNP"
    );
    if (dnpBitcoin.manifest) bitcoinManifest = dnpBitcoin.manifest;
    else throw Error("No manifest is Bitcoin DNP");
  }).timeout(60 * 1000);

  it("Should fetch BIND's package data", async () => {
    await calls.fetchPackageData({ id: bindId });
  }).timeout(60 * 1000);

  it("Should fetch Bitcoin's package data", async () => {
    const { result } = await calls.fetchPackageData({ id: bitcoinId });
    expect(result.manifest).to.deep.equal(
      bitcoinManifest,
      "Inconsistent manifest for BITCOIN"
    );
  }).timeout(60 * 1000);
});
