import "mocha";
import { expect } from "chai";
import { parseDuOutput, DuResult } from "../../src/getHostVolumeSizes.js";

describe("utils > unix", () => {
  describe("parseDuOutput", () => {
    it("should parse basic du output", () => {
      const output = `
  9080410	./node_modules/eslint
649172410	./node_modules
16410	./hostScripts
16410	./.temp-transfer
652410	./dist/calls
3492410	./dist
116410	./test/calls
1980410	./test
596410	./src/calls
3224410	./src
659048410	.
      `;

      const expectedResult: DuResult[] = [
        { size: "9080410", path: "node_modules/eslint" },
        { size: "649172410", path: "node_modules" },
        { size: "16410", path: "hostScripts" },
        { size: "16410", path: ".temp-transfer" },
        { size: "652410", path: "dist/calls" },
        { size: "3492410", path: "dist" },
        { size: "116410", path: "test/calls" },
        { size: "1980410", path: "test" },
        { size: "596410", path: "src/calls" },
        { size: "3224410", path: "src" },
        { size: "659048410", path: "." },
      ];

      const result = parseDuOutput(output);

      expect(result).to.deep.equal(expectedResult);
    });

    it("should parse DAppNode dir output", () => {
      const output = `
      824204410	/mnt/volume_ams3_01/dappnode-volumes/bitcoin.dnp.dappnode.eth/bitcoin_data
      824208410	/mnt/volume_ams3_01/dappnode-volumes/bitcoin.dnp.dappnode.eth
      824212410	/mnt/volume_ams3_01/dappnode-volumes
      `;
      const relativeFrom = "/mnt/volume_ams3_01/dappnode-volumes";

      const expectedResult: DuResult[] = [
        { size: "824204410", path: "bitcoin.dnp.dappnode.eth/bitcoin_data" },
        { size: "824208410", path: "bitcoin.dnp.dappnode.eth" },
        { size: "824212410", path: "." },
      ];

      const result = parseDuOutput(output, relativeFrom);

      expect(result).to.deep.equal(expectedResult);
    });
  });
});
