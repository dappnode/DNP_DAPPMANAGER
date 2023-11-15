import "mocha";
import { expect } from "chai";
import { seedToPrivateKey } from "../../../src/calls/seedPhraseSet.js";

describe("Util > seedPhrase", () => {
  describe("seedToPrivateKey", () => {
    const seedPhrases: {
      seedPhrase: string;
      privateKey?: string;
      error?: string;
    }[] = [
      {
        seedPhrase:
          "busy target follow choose season use prepare seed grass vote solve drum",
        privateKey:
          "0xaaa94712951f6d3aef9e86a91d2cbc86bdc158738ff7e04537f9e5b9e8bf1e1b"
      },
      {
        seedPhrase:
          "busy  target  follow  choose  season  use  prepare  seed  grass  vote  solve  drum",
        privateKey:
          "0xaaa94712951f6d3aef9e86a91d2cbc86bdc158738ff7e04537f9e5b9e8bf1e1b"
      },
      {
        seedPhrase:
          "busy               target    follow   choose           season  \n\n  use    prepare \t seed       grass vote solve drum",
        privateKey:
          "0xaaa94712951f6d3aef9e86a91d2cbc86bdc158738ff7e04537f9e5b9e8bf1e1b"
      },
      {
        seedPhrase:
          "busy target follow choose season use prepare seed grass vote solve",
        error: "seed phrase must contain exactly 12 words"
      },
      {
        seedPhrase: "randomWord ".repeat(12),
        error: "invalid mnemonic"
      }
    ];

    for (const { seedPhrase, privateKey, error } of seedPhrases) {
      it(`Should convert seedPhrase ${seedPhrase}`, () => {
        try {
          const res = seedToPrivateKey(seedPhrase);
          if (error) throw Error(`Should had thrown error: ${error}`);
          else expect(res.privateKey).to.equal(privateKey, "Wrong privateKey");
        } catch (e) {
          if (error) expect(e.message).to.equal(error, "Wrong error message");
          else {
            e.message = `Unexpected error: ${e.message}`;
            throw e;
          }
        }
      });
    }
  });
});
