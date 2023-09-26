import "mocha";
import { expect } from "chai";
import { params } from "@dappnode/params";

import {
  generateKeyPair,
  encrypt,
  decrypt
} from "../../../src/utils/publickeyEncryption.js";

describe("Util > publickeyEncryption", () => {
  it("Should encrypt and decrypt a payload", () => {
    const alice = generateKeyPair();
    const bob = generateKeyPair();

    const plain = "secret message";
    const cypher = encrypt(plain, bob.secretKey, alice.publicKey);

    const receivedPlain = decrypt(cypher, alice.secretKey, bob.publicKey);
    expect(receivedPlain).to.equal(plain);
  });

  it("Should encrypt and decrypt a seed phrase using the admin public key", () => {
    const dappmanagerKeys = generateKeyPair();

    // Admin sends encrypted payload
    const plainSeedPhrase =
      "busy target follow choose season use prepare seed grass vote solve drum";
    const encryptedSeedPhrase = encrypt(
      plainSeedPhrase,
      params.ADMIN_NACL_SECRET_KEY,
      dappmanagerKeys.publicKey
    );

    const receivedPlainSeedPhrase = decrypt(
      encryptedSeedPhrase,
      dappmanagerKeys.secretKey,
      params.ADMIN_NACL_PUBLIC_KEY
    );

    expect(receivedPlainSeedPhrase).to.equal(plainSeedPhrase);
  });
});
