import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl, printData } from "../endToEndUtils";
import { validateRoutesReturn } from "../../../src/common";

describe.skip(`HTTPS portal`, async () => {
  const httpsPortalMappingAdd = "httpsPortalMappingAdd";
  const httpsPortalMappingRemove = "httpsPortalMappingRemove";
  const httpsPortalMappingsRecreate = "httpsPortalMappingsRecreate";
  const httpsPortalMappingsGet = "httpsPortalMappingsGet";
  const httpsPortalExposableServicesGet = "httpsPortalExposableServicesGet";

  describe(`API call ${httpsPortalMappingAdd}`, async () => {
    const url = new URL(`${dappmanagerTestApiUrl}/${httpsPortalMappingAdd}`);
    it("Should add a new mapping to the https portal", async () => {
      const data = {
        fromSubdomain: "test",
        dnpName: "ipfs.dnp.dappnode.eth",
        serviceName: "ipfs.dnp.dappnode.eth",
        port: 7001
      };
      url.searchParams.set("mapping", JSON.stringify(data));
      const response = await fetch(url);
      expect(response.status).to.equal(200);
    });
  });

  describe(`API call ${httpsPortalMappingsGet}`, async () => {
    const url = new URL(`${dappmanagerTestApiUrl}/${httpsPortalMappingsGet}`);
    it("Should get the HTTPS portal mappings", async () => {
      const response = await fetch(url);
      expect(response.status).to.equal(200);
      const body = await response.json();
      printData(body);
      expect(validateRoutesReturn(httpsPortalMappingsGet, body)).to.not.throw;
    });
  });

  describe(`API call ${httpsPortalExposableServicesGet}`, async () => {
    const url = new URL(
      `${dappmanagerTestApiUrl}/${httpsPortalExposableServicesGet}`
    );
    it("Should get the HTTPS portal exposable services", async () => {
      const response = await fetch(url);
      expect(response.status).to.equal(200);
      const body = await response.json();
      printData(body);
      expect(validateRoutesReturn(httpsPortalExposableServicesGet, body)).to.not
        .throw;
    });
  });

  describe(`API call ${httpsPortalMappingsRecreate}`, async () => {
    const url = new URL(
      `${dappmanagerTestApiUrl}/${httpsPortalMappingsRecreate}`
    );
    it("Should recreate the HTTPS portal mapping", async () => {
      const response = await fetch(url);
      expect(response.status).to.equal(200);
    });
  });

  describe(`API call ${httpsPortalMappingRemove}`, async () => {
    const url = new URL(`${dappmanagerTestApiUrl}/${httpsPortalMappingRemove}`);
    it("Should remove a given mapping from the https portal", async () => {
      const data = {
        fromSubdomain: "test",
        dnpName: "ipfs.dnp.dappnode.eth",
        serviceName: "ipfs.dnp.dappnode.eth",
        port: 7001
      };
      url.searchParams.set("mapping", JSON.stringify(data));
      const response = await fetch(url);
      expect(response.status).to.equal(200);
    });
  });
});
