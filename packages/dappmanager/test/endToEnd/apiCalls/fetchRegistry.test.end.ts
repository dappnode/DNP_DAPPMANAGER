import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl, printData } from "../endToEndUtils";
import { validateRoutesReturn } from "../../../src/common";

describe(`Registry`, async () => {
  const fetchRegistryProgress = "fetchRegistryProgress";
  const fetchRegistry = "fetchRegistry";
  describe(`API call ${fetchRegistryProgress}`, async () => {
    it("Should return last block and last fetched block to show progress in the UI", async () => {
      const urlRegistry = new URL(
        `${dappmanagerTestApiUrl}/${fetchRegistryProgress}`
      );
      const data = {
        addressOrEnsName: "dappmanager.dnp.dappnode.eth",
        fromBlock: 16237843
      };
      urlRegistry.searchParams.set("addressOrEnsName", data.addressOrEnsName);
      urlRegistry.searchParams.set("fromBlock", data.fromBlock.toString());

      const response = await fetch(urlRegistry);
      expect(response.status).to.equal(200);
      const body = await response.json();
      printData(body);
      expect(validateRoutesReturn(fetchRegistryProgress, body)).to.not.throw;
    });
  });

  describe(`API call ${fetchRegistry}`, async () => {
    it("Should fetch new repos from registry by scanning the chain", async () => {
      const urlRegistry = new URL(`${dappmanagerTestApiUrl}/${fetchRegistry}`);
      const data = {
        addressOrEnsName: "dappmanager.dnp.dappnode.eth",
        fromBlock: 16237843
      };
      urlRegistry.searchParams.set("addressOrEnsName", data.addressOrEnsName);
      urlRegistry.searchParams.set("fromBlock", data.fromBlock.toString());

      const response = await fetch(urlRegistry);
      expect(response.status).to.equal(200);
      const body = await response.json();
      printData(body);
      expect(validateRoutesReturn(fetchRegistry, body)).to.not.throw;
    });
  });
});
