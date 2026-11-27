import { expect } from "chai";
import { isValidatorPackage } from "../../../src/fullBackup/coverage.js";

describe("fullBackup / isValidatorPackage", () => {
  const byName = (dnpName: string): boolean => isValidatorPackage({ dnpName, backup: [] });

  it("matches validator packages by a whole segment of their name", () => {
    for (const dnpName of [
      "web3signer.dnp.dappnode.eth",
      "web3signer-gnosis.dnp.dappnode.eth",
      "web3signer-starknet-sepolia.dnp.dappnode.eth",
      "lido-csm-hoodi.dnp.dappnode.eth",
      "obol.dnp.dappnode.eth",
      "holesky-obol.dnp.dappnode.eth",
      "ssv.dnp.dappnode.eth",
      "ssv-hoodi.dnp.dappnode.eth",
      "stakewise.dnp.dappnode.eth",
      "rocketpool.dnp.dappnode.eth",
      "rocketpool-testnet.public.dappnode.eth",
      "stader-testnet.dnp.dappnode.eth",
      "diva.dnp.dappnode.eth",
      "charon.public.dappnode.eth",
      "SSV-Hoodi.dnp.dappnode.eth"
    ]) {
      expect(byName(dnpName), dnpName).to.equal(true);
    }
  });

  it("does not match names that merely contain a validator name", () => {
    for (const dnpName of [
      "passvault.dnp.dappnode.eth",
      "divagate.public.dappnode.eth",
      "macharon.dnp.dappnode.eth",
      "symbol.dnp.dappnode.eth",
      "geth.dnp.dappnode.eth"
    ]) {
      expect(byName(dnpName), dnpName).to.equal(false);
    }
  });

  it("matches any package whose backup items hold keystores, validators or slashing protection", () => {
    const dnpName = "example.dnp.dappnode.eth";
    expect(isValidatorPackage({ dnpName, backup: [{ name: "keystores", path: "/data" }] })).to.equal(true);
    expect(isValidatorPackage({ dnpName, backup: [{ name: "db", path: "/data/validators" }] })).to.equal(true);
    expect(isValidatorPackage({ dnpName, backup: [{ name: "slashing-protection", path: "/db" }] })).to.equal(true);
    expect(isValidatorPackage({ dnpName, backup: [{ name: "data", path: "/data" }] })).to.equal(false);
  });
});
