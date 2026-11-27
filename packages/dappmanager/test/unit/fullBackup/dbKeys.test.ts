import fs from "fs";
import path from "path";
import { expect } from "chai";
import {
  cacheDbExcludedKeys,
  cacheDbIncludedKeys,
  mainDbExcludedKeys,
  mainDbIncludedKeys,
  nexusDbIncludedKeys,
  pickKeys
} from "../../../src/fullBackup/dbKeys.js";

const dbSrcDir = path.resolve(process.cwd(), "../db/src");

/**
 * Parse packages/db/src and return every DB key per database. Keys are
 * declared as string constants and used with dbMain/dbCache/dbNexus
 * .staticKey(KEY, ...) or .indexedByKey({ rootKey: KEY })
 */
function readDeclaredKeys(): { main: Set<string>; cache: Set<string>; nexus: Set<string> } {
  const result = { main: new Set<string>(), cache: new Set<string>(), nexus: new Set<string>() };
  for (const file of fs.readdirSync(dbSrcDir).filter((f) => f.endsWith(".ts"))) {
    const source = fs.readFileSync(path.join(dbSrcDir, file), "utf8");
    const constants = new Map<string, string>();
    for (const [, name, value] of source.matchAll(/const (\w+) = "([^"]+)";/g)) constants.set(name, value);

    const usages: { dbName: string; constName: string }[] = [
      ...source.matchAll(/(dbMain|dbCache|dbNexus)\.staticKey<[^(]*>\(\s*(\w+)/g),
      ...source.matchAll(/(dbMain|dbCache|dbNexus)\.indexedByKey<[^(]*>\(\{\s*rootKey:\s*(\w+)/g)
    ].map(([, dbName, constName]) => ({ dbName, constName }));

    // Keys declared in a factory that receives the DB as an argument, e.g.
    // createIpfsGatewayDb(db, ...) { db.staticKey(...) } called with dbMain
    const injectedDb = source.match(/= create\w+\(\s*(dbMain|dbCache|dbNexus)\b/)?.[1];
    if (injectedDb) {
      for (const [, constName] of source.matchAll(/\bdb\.staticKey<[^(]*>\(\s*(\w+)/g))
        usages.push({ dbName: injectedDb, constName });
    }

    for (const { dbName, constName } of usages) {
      const key = constants.get(constName);
      if (!key) throw Error(`Unresolved DB key constant ${constName} in ${file}`);
      const target = dbName === "dbMain" ? result.main : dbName === "dbCache" ? result.cache : result.nexus;
      target.add(key);
    }
  }
  return result;
}

describe("fullBackup / dbKeys", () => {
  const declared = readDeclaredKeys();

  it("finds the DB keys declared in packages/db", () => {
    expect(declared.main.size).to.be.greaterThan(30);
    expect(declared.cache.size).to.be.greaterThan(10);
    expect(declared.nexus.size).to.be.greaterThan(0);
  });

  it("classifies every maindb key as included or excluded", () => {
    const classified = new Set([...Object.keys(mainDbIncludedKeys), ...Object.keys(mainDbExcludedKeys)]);
    const unclassified = [...declared.main].filter((key) => !classified.has(key));
    expect(unclassified, "add these keys to fullBackup/dbKeys.ts").to.deep.equal([]);
  });

  it("classifies every cache DB key as included or excluded", () => {
    const classified = new Set([...Object.keys(cacheDbIncludedKeys), ...Object.keys(cacheDbExcludedKeys)]);
    const unclassified = [...declared.cache].filter((key) => !classified.has(key));
    expect(unclassified, "add these keys to fullBackup/dbKeys.ts").to.deep.equal([]);
  });

  it("classifies every nexus DB key", () => {
    const unclassified = [...declared.nexus].filter((key) => !(key in nexusDbIncludedKeys));
    expect(unclassified, "add these keys to fullBackup/dbKeys.ts").to.deep.equal([]);
  });

  it("does not list a key as both included and excluded", () => {
    for (const key of Object.keys(mainDbIncludedKeys)) expect(mainDbExcludedKeys).to.not.have.property(key);
    for (const key of Object.keys(cacheDbIncludedKeys)) expect(cacheDbExcludedKeys).to.not.have.property(key);
  });

  it("only lists keys that still exist", () => {
    const stale = [
      ...Object.keys(mainDbIncludedKeys).filter((k) => !declared.main.has(k)),
      ...Object.keys(mainDbExcludedKeys).filter((k) => !declared.main.has(k)),
      ...Object.keys(cacheDbIncludedKeys).filter((k) => !declared.cache.has(k)),
      ...Object.keys(cacheDbExcludedKeys).filter((k) => !declared.cache.has(k))
    ];
    expect(stale, "remove these keys from fullBackup/dbKeys.ts").to.deep.equal([]);
  });

  it("picks only included keys", () => {
    const picked = pickKeys(
      { "dappnode-web-name": "my node", "internal-ip": "192.168.1.2", "old-unknown-key": 1 },
      mainDbIncludedKeys
    );
    expect(picked).to.deep.equal({ "dappnode-web-name": "my node" });
  });
});
