import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl } from "../endToEndUtils";
import { validateRoutesReturn } from "../../../src/common";
import { PackageBackup } from "@dappnode/dappnodesdk";
import fetch from "node-fetch";
import { URL } from "url";

const apiCallMethod = "backupGet";

describe(`API call ${apiCallMethod}`, async () => {
  it("Should does a backup of a DNP and sends it to the client for download", async () => {
    const url = new URL(`${dappmanagerTestApiUrl}/${apiCallMethod}`);
    const data: { dnpName: string; backup: PackageBackup[] } = {
      dnpName: "dappmanager.dnp.dappnode.eth",
      backup: [
        {
          name: "test",
          path: "/tmp/test"
        }
      ]
    };
    url.searchParams.append("dnpName", data.dnpName);
    url.searchParams.append("backup", data.backup.toString());
    const response = await fetch(url);
    expect(response.status).to.equal(200);
    const body = await response.json();
    expect(validateRoutesReturn(apiCallMethod, body)).to.be.ok;
  });
});
