import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl, printData } from "../endToEndUtils";
import { validateRoutesReturn } from "../../../src/common";

describe("Docker", async () => {
  const dockerEngineUpdateCheck = "dockerEngineUpdateCheck";
  const dockerComposeUpdateCheck = "dockerComposeUpdateCheck";

  describe(`API call ${dockerEngineUpdateCheck}`, async () => {
    const url = new URL(`${dappmanagerTestApiUrl}/${dockerEngineUpdateCheck}`);
    it("Should return the docker engine update data", async () => {
      const response = await fetch(url);
      expect(response.status).to.equal(200);
      const body = await response.json();
      printData(body);
      expect(validateRoutesReturn(dockerEngineUpdateCheck, body)).to.not.throw;
    });
  });

  // TODO: implement test for dockerEngineUpdate

  describe(`API call ${dockerComposeUpdateCheck}`, async () => {
    const url = new URL(`${dappmanagerTestApiUrl}/${dockerComposeUpdateCheck}`);
    it("Should return the docker compose update data", async () => {
      const response = await fetch(url);
      expect(response.status).to.equal(200);
      const body = await response.json();
      printData(body);
      expect(validateRoutesReturn(dockerComposeUpdateCheck, body)).to.not.throw;
    });
  });

  // TODO: implement test for dockerComposeUpdate
});
