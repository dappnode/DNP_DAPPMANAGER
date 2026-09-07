import { expect } from "chai";
import fs from "node:fs";
import * as db from "@dappnode/db";
import { params } from "@dappnode/params";
import { TrustedReleaseKey } from "@dappnode/types";
import {
  releaseTrustedKeyAdd,
  releaseTrustedKeyList,
  releaseTrustedKeyRemove,
  releaseTrustedKeyReset
} from "../../../src/calls/releaseTrustedKey.js";

describe("Trusted release keys", () => {
  const defaults = structuredClone(params.DEFAULT_RELEASE_TRUSTED_KEYS);
  const customKey: TrustedReleaseKey = { ...defaults[0], name: "Custom key", key: "0x1234" };

  beforeEach(() => db.releaseKeysTrusted.remove());
  afterEach(() => db.releaseKeysTrusted.remove());

  it("uses defaults until edited, without mutating the defaults", async () => {
    expect(await releaseTrustedKeyList()).to.deep.equal(defaults);
    await releaseTrustedKeyAdd(customKey);
    expect(await releaseTrustedKeyList()).to.deep.equal([...defaults, customKey]);
    expect(params.DEFAULT_RELEASE_TRUSTED_KEYS).to.deep.equal(defaults);
  });

  it("persists removals, including an empty list", async () => {
    for (const [index, key] of defaults.entries()) {
      await releaseTrustedKeyRemove(key.name, key.dnpNameSuffix);
      expect(await releaseTrustedKeyList()).to.deep.equal(defaults.slice(index + 1));
    }
    expect(await releaseTrustedKeyList()).to.deep.equal([]);
    await releaseTrustedKeyAdd(customKey);
    expect(await releaseTrustedKeyList()).to.deep.equal([customKey]);
  });

  it("deletes the saved list on reset and preserves other settings", async () => {
    await releaseTrustedKeyAdd(customKey);
    const savedDb = JSON.parse(fs.readFileSync(params.DB_MAIN_PATH, "utf8"));
    delete savedDb["release-keys-trusted"];
    await releaseTrustedKeyReset();
    expect(await releaseTrustedKeyList()).to.deep.equal(defaults);
    expect(JSON.parse(fs.readFileSync(params.DB_MAIN_PATH, "utf8"))).not.to.have.property("release-keys-trusted");
    expect(JSON.parse(fs.readFileSync(params.DB_MAIN_PATH, "utf8"))).to.deep.equal(savedDb);
    await releaseTrustedKeyReset();
    expect(await releaseTrustedKeyList()).to.deep.equal(defaults);
  });
});
