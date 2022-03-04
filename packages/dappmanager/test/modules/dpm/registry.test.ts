import { expect } from "chai";
import {
  Flags,
  parseFlags,
  parsePackageListHex,
  sortWithPackageList
} from "../../../src/modules/dpm/registry";

describe("dpm / registry", () => {
  describe("parsePackageListHex", () => {
    const testCases: {
      listHex: string;
      bytesPerItem: number;
      result: number[];
    }[] = [
      { listHex: "0x", bytesPerItem: 1, result: [] },
      { listHex: "0x0a0402", bytesPerItem: 1, result: [10, 4, 2] },
      { listHex: "0x000a00040002", bytesPerItem: 2, result: [10, 4, 2] }
    ];

    for (const { listHex, bytesPerItem, result } of testCases) {
      it(listHex, () => {
        expect(parsePackageListHex(listHex, bytesPerItem)).to.deep.equals(
          result
        );
      });
    }
  });

  describe("parseFlags", () => {
    const testCases: { flags: number; result: Record<Flags, boolean> }[] = [
      {
        flags: 0,
        result: {
          active: false,
          validated: false,
          banned: false,
          hidden: false
        }
      },
      {
        flags: 1,
        result: {
          active: true,
          validated: false,
          banned: false,
          hidden: false
        }
      },
      {
        flags: 2,
        result: {
          active: false,
          validated: true,
          banned: false,
          hidden: false
        }
      },
      {
        flags: 4,
        result: {
          active: false,
          validated: false,
          banned: true,
          hidden: false
        }
      },
      {
        flags: 15,
        result: {
          active: true,
          validated: true,
          banned: true,
          hidden: true
        }
      }
    ];

    for (const { flags, result } of testCases) {
      it(`flags ${flags} `, () => {
        expect(parseFlags(flags)).to.deep.equals(result);
      });
    }
  });

  describe("sortWithPackageList", () => {
    const values = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const allIndexes = values.map((_, i) => i);

    const testCases: { indexList: number[]; result: string[] }[] = [
      { indexList: [], result: values },
      { indexList: [3, 2], result: ["d", "c", "a", "b", "e", "f", "g", "h"] },
      { indexList: allIndexes, result: values },
      { indexList: [...allIndexes].reverse(), result: [...values].reverse() }
    ];

    for (const { indexList, result } of testCases) {
      it(JSON.stringify(indexList), () => {
        expect(sortWithPackageList(indexList, values)).to.deep.equal(result);
      });
    }
  });
});
