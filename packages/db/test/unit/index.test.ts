import fs from "fs";
import path from "path";
import { beforeAndAfter, createTestDir, testDir } from "../testUtils.js";
import { dbFactory } from "../../src/dbFactory.js";
import { expect } from "chai";

describe("db", () => {
  beforeAndAfter("Clean files", async () => {
    await createTestDir();
  });

  it("Should read modify and write db", () => {
    const dbPath = path.join(testDir, "test-db.json");
    const { staticKey, indexedByKey } = dbFactory(dbPath);

    const STATIC_VALUE_KEY = "static-value";
    const INDEXED_VALUE_KEY = "indexed-value";

    const staticValue = staticKey(STATIC_VALUE_KEY, 1);
    const indexedValue = indexedByKey<number, string>({
      rootKey: INDEXED_VALUE_KEY,
      getKey: (arg) => arg,
    });

    // staticValue

    expect(staticValue.get()).to.equal(1, "staticValue - wrong def value");
    staticValue.set(5);
    expect(staticValue.get()).to.equal(5, "staticValue - wrong new value");

    // indexedValue

    expect(indexedValue.getAll()).to.deep.equal(
      {},
      "indexedValue - wrong def getAll"
    );
    expect(indexedValue.get("a")).to.deep.equal(
      undefined,
      "indexedValue - wrong def get('a')"
    );
    indexedValue.set("a", 5);
    expect(indexedValue.getAll()).to.deep.equal(
      { a: 5 },
      "indexedValue - wrong getAll"
    );
    expect(indexedValue.get("a")).to.deep.equal(
      5,
      "indexedValue - wrong get('a')"
    );

    expect(fs.readFileSync(dbPath, "utf8").trim()).to.equal(
      JSON.stringify(
        {
          [STATIC_VALUE_KEY]: 5,
          [INDEXED_VALUE_KEY]: {
            a: 5,
          },
        },
        null,
        2
      )
    );
  });
});
