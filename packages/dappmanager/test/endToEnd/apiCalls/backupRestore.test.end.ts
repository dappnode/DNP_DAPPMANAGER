import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl } from "../endToEndUtils";
import { validateRoutesReturn } from "../../../src/common";
import fetch from "node-fetch";
import { URL } from "url";
import { PackageBackup } from "@dappnode/dappnodesdk";

const apiCallMethod = "backupRestore";

describe(`API call ${apiCallMethod}`, async () => {
  it("Should Restore a previous backup of a DNP, from the dataUri provided by the user", async () => {
    const url = new URL(`${dappmanagerTestApiUrl}/${apiCallMethod}`);
    const data: { dnpName: string; backup: PackageBackup[]; fileId: string } = {
      dnpName: "dappmanager.dnp.dappnode.eth",
      backup: [
        {
          name: "test",
          path: "/tmp/test"
        }
      ],
      fileId: "test"
    };
    url.searchParams.append("dnpName", data.dnpName);
    url.searchParams.append("backup", data.backup.toString());
    const response = await fetch(url);
    expect(response.status).to.equal(200);
    const body = await response.json();
    expect(validateRoutesReturn(apiCallMethod, body)).to.be.ok;
  });
});
