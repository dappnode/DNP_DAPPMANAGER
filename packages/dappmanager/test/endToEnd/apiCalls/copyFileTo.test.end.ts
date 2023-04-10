import "mocha";
import fs from "fs";
import path from "path";
import { expect } from "chai";
import { dappmanagerTestApiUrl } from "../endToEndUtils";

const apiCallMethod = "copyFileTo";
const url = new URL(`${dappmanagerTestApiUrl}/${apiCallMethod}`);

describe(`API call ${apiCallMethod}`, async () => {
  const hostRootPath = "/usr/src/dappnode/DNCORE";
  const composeCopyFileName = "docker-compose-dappmanager-copy.yml";
  const composeFileName = "docker-compose-dappmanager.yml";
  const toPath = "/usr/src/app/DNCORE/";

  // Permissions issues
  // TODO: implement test with a file without permissions
  /*   before(() => {
    if (fs.existsSync(path.join(hostRootPath, composeCopyFileName))) {
      fs.unlinkSync(path.join(hostRootPath, composeCopyFileName));
    }
  });

  after(() => {
    if (fs.existsSync(path.join(hostRootPath, composeCopyFileName))) {
      fs.unlinkSync(path.join(hostRootPath, composeCopyFileName));
    }
  }); */

  it("Should copy a file to a given dir on a given container", async () => {
    const dockerComposeDappmanager = fs.readFileSync(
      path.join(hostRootPath, composeFileName),
      "utf8"
    );
    const dataUri = `data:application/x-yaml;base64,${Buffer.from(
      dockerComposeDappmanager
    ).toString("base64")}`;
    const data = {
      containerName: "DAppNodeCore-dappmanager.dnp.dappnode.eth",
      dataUri,
      filename: composeCopyFileName,
      toPath
    };
    url.searchParams.set("containerName", data.containerName);
    url.searchParams.set("dataUri", data.dataUri);
    url.searchParams.set("filename", data.filename);
    url.searchParams.set("toPath", data.toPath);
    const response = await fetch(url);
    expect(response.status).to.equal(200);

    const dappmanagerCopy = fs.readFileSync(
      path.join(hostRootPath, composeCopyFileName),
      "utf8"
    );
    expect(dappmanagerCopy).to.equal(dockerComposeDappmanager);
  });
});
