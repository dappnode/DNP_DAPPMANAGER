import "mocha";
import { expect } from "chai";
import { dappmanagerTestApiUrl } from "../endToEndUtils";
import { validateRoutesReturn } from "../../../src/common";
import fetch from "node-fetch";
import { URL } from "url";
import { PackageBackup } from "@dappnode/dappnodesdk";

const apiCallMethod = "backupRestore";
const url = new URL(`${dappmanagerTestApiUrl}/${apiCallMethod}`);

describe.skip(`API call ${apiCallMethod}`, async () => {
  it("Should restore a previous backup of a DNP, from the dataUri provided by the user", async () => {
    const data: { dnpName: string; backup: PackageBackup[]; fileId: string } = {
      dnpName: "dappmanager.dnp.dappnode.eth",
      backup: [
        {
          name: "docker-compose.dappmanager.yml",
          path: "/usr/src/app/DNCORE"
        }
      ],
      fileId: "test"
    };

    url.searchParams.set("dnpName", data.dnpName);
    url.searchParams.set("backup", JSON.stringify(data.backup));
    url.searchParams.set("fileId", data.fileId);
    const response = await fetch(url);
    expect(response.status).to.equal(200);
    const body = await response.json();
    console.debug(`data: ${JSON.stringify(body, null, 6)}`);
    expect(validateRoutesReturn(apiCallMethod, body)).to.not.throw;
  });
});
