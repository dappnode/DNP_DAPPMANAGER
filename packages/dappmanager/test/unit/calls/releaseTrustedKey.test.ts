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
    expect((await releaseTrustedKeyList()).keys).to.deep.equal(defaults);
    await releaseTrustedKeyAdd(customKey);
    expect((await releaseTrustedKeyList()).keys).to.deep.equal([...defaults, customKey]);
    expect(params.DEFAULT_RELEASE_TRUSTED_KEYS).to.deep.equal(defaults);
  });

  it("reports defaults only when no trusted keys list is saved", async () => {
    expect((await releaseTrustedKeyList()).isDefault).to.equal(true);
    await releaseTrustedKeyAdd(customKey);
    expect((await releaseTrustedKeyList()).isDefault).to.equal(false);
    await releaseTrustedKeyReset();
    expect((await releaseTrustedKeyList()).isDefault).to.equal(true);
    db.releaseKeysTrusted.set([...defaults]);
    expect((await releaseTrustedKeyList()).isDefault).to.equal(false);
    await releaseTrustedKeyRemove(defaults[0].name, defaults[0].dnpNameSuffix);
    expect((await releaseTrustedKeyList()).isDefault).to.equal(false);
    db.releaseKeysTrusted.set([{ ...defaults[0], key: "0x1234" }, ...defaults.slice(1)]);
    expect((await releaseTrustedKeyList()).isDefault).to.equal(false);
    db.releaseKeysTrusted.set([]);
    expect((await releaseTrustedKeyList()).isDefault).to.equal(false);
  });

  it("persists removals, including an empty list", async () => {
    for (const [index, key] of defaults.entries()) {
      await releaseTrustedKeyRemove(key.name, key.dnpNameSuffix);
      expect((await releaseTrustedKeyList()).keys).to.deep.equal(defaults.slice(index + 1));
    }
    expect((await releaseTrustedKeyList()).keys).to.deep.equal([]);
    await releaseTrustedKeyAdd(customKey);
    expect((await releaseTrustedKeyList()).keys).to.deep.equal([customKey]);
  });

  it("deletes the saved list on reset and preserves other settings", async () => {
    await releaseTrustedKeyAdd(customKey);
    const savedDb = JSON.parse(fs.readFileSync(params.DB_MAIN_PATH, "utf8"));
    delete savedDb["release-keys-trusted"];
    await releaseTrustedKeyReset();
    expect((await releaseTrustedKeyList()).keys).to.deep.equal(defaults);
    expect(JSON.parse(fs.readFileSync(params.DB_MAIN_PATH, "utf8"))).not.to.have.property("release-keys-trusted");
    expect(JSON.parse(fs.readFileSync(params.DB_MAIN_PATH, "utf8"))).to.deep.equal(savedDb);
    await releaseTrustedKeyReset();
    expect((await releaseTrustedKeyList()).keys).to.deep.equal(defaults);
  });
});
