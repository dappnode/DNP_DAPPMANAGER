import "mocha";
import fs from "fs";
import { expect } from "chai";
import { mockPackageData, shellSafe } from "../testUtils.js";
import {
  packageToInstallHasPid,
  getServicesSharingPid,
  ComposeServicesSharingPid
} from "@dappnode/utils";
import { ComposeFileEditor } from "@dappnode/dockercompose";

describe("Module > compose > pid", () => {
  // Example package
  const dnpName = "erigon.dnp.dappnode.eth";
  const dnpErigonPath = process.cwd() + "/dnp_repo/" + dnpName;
  const erigonCompose = `
version: "3.4"
services:
  erigon:
    image: "erigon.erigon.dnp.dappnode.eth:0.1.0"
    build:
      context: erigon
      args:
        UPSTREAM_VERSION: v2021.07.05
    ports:
      - 30303/tcp
      - 30303/udp
      - 30304/tcp
      - 30304/udp
    restart: unless-stopped
    volumes:
      - "data:/home/erigon/.local/share/erigon"
    environment:
      ERIGON_EXTRA_OPTS: ""
  rpcdaemon:
    image: "rpcdaemon.erigon.dnp.dappnode.eth:0.1.0"
    build:
      context: rpcdaemon
      args:
        UPSTREAM_VERSION: v2021.07.05
    pid: "service:erigon"
    environment:
      RPCDAEMON_EXTRA_OPTS: "--http.api=eth,debug,net,web3"
    restart: unless-stopped
    volumes:
      - "data:/home/erigon/.local/share/erigon"
volumes:
  data: {}
`;

  before("Create random compose to be analyzed", async () => {
    // Create necessary dir
    await shellSafe(`mkdir -p ${dnpErigonPath}`);
    // Create example compose
    fs.writeFileSync(`${dnpErigonPath}/docker-compose.yml`, erigonCompose);
  });

  it("Should return false because compose to install does not contains pid", () => {
    expect(packageToInstallHasPid(mockPackageData)).to.deep.equal(false);
  });

  it("Should return true because compose to install contains pid", () => {
    const examplePackage = mockPackageData;
    examplePackage.compose = {
      version: "3.5",
      services: {
        "erigon.dnp.dappnode.eth": {
          volumes: ["data:/home/erigon/.local/share/erigon"],
          container_name: "DAppNodePackage-erigon.erigon.dnp.dappnode.eth",
          image: "erigon.erigon.dnp.dappnode.eth:0.1.0"
        },
        "rpcdaemon.dnp.dappnode.eth": {
          volumes: ["data:/home/erigon/.local/share/erigon"],
          container_name: "DAppNodePackage-rpcdaemon.erigon.dnp.dappnode.eth",
          image: "rpcdaemon.erigon.dnp.dappnode.eth:0.1.0",
          pid: "service:erigon"
        }
      },
      volumes: {
        data: {
          driver_opts: {
            type: "none",
            o: "bind"
          }
        }
      },
      networks: {
        dncore_network: {
          external: true
        }
      }
    };

    expect(packageToInstallHasPid(examplePackage)).to.deep.equal(true);
  });

  it("Should return the services sharing pid", () => {
    const compose = new ComposeFileEditor(dnpName, false);
    const expectedResult: ComposeServicesSharingPid = {
      targetPidServices: ["erigon"],
      dependantPidServices: ["rpcdaemon"]
    };

    expect(getServicesSharingPid(compose.compose)).to.deep.equal(
      expectedResult
    );
  });
});
