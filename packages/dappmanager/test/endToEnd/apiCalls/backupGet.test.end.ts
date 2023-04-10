import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl, printData } from "../endToEndUtils";
import { validateRoutesReturn } from "../../../src/common";
import { PackageBackup } from "@dappnode/dappnodesdk";
import fetch from "node-fetch";
import { URL } from "url";

const apiCallMethod = "backupGet";
const url = new URL(`${dappmanagerTestApiUrl}/${apiCallMethod}`);

describe(`API call ${apiCallMethod}`, async () => {
  it("Should do a backup of a DNP and sends it to the client for download", async () => {
    const data: { dnpName: string; backup: PackageBackup[] } = {
      dnpName: "dappmanager.dnp.dappnode.eth",
      backup: [
        {
          name: "docker-compose.dappmanager.yml",
          path: "/usr/src/app/DNCORE"
        }
      ]
    };
    url.searchParams.set("dnpName", data.dnpName);
    url.searchParams.set("backup", JSON.stringify(data.backup));
    const response = await fetch(url);
    expect(response.status).to.equal(200);
    const body = await response.text();
    printData(body);
    expect(validateRoutesReturn(apiCallMethod, body)).to.not.throw;
  });
});
