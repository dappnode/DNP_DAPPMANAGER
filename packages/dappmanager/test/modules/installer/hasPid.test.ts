import "mocha";
import { expect } from "chai";
import { mockPackageData } from "../../testUtils";
import { packageToInstallHasPid } from "../../../src/modules/compose/pid";

describe("Module > compose > pid", () => {
  it("Should return false because compose does not contains pid", () => {
    expect(packageToInstallHasPid(mockPackageData)).to.deep.equal(false);
  });

  it("Should return true because compose contains pid", () => {
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
});
