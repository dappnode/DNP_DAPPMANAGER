import "mocha";
import { expect } from "chai";
import { Compose } from "../../../src/types";

import { getCustomVolumeDevicePaths } from "../../../src/modules/installer/createCustomVolumeDevicePaths";

describe("Module > installer > createCustomVolumeDevicePaths", () => {
  it("Should parse the list of volume paths to create from compose", () => {
    const devicePath =
      "/mnt/volume_ams3_01/dappnode-volumes/raiden.dnp.dappnode.eth/data";

    /* eslint-disable @typescript-eslint/camelcase */
    const sampleCompose: Compose = {
      version: "3.4",
      services: {
        "raiden.dnp.dappnode.eth": {
          volumes: ["data:/root/.raiden"],
          container_name: "DAppNodePackage-raiden.dnp.dappnode.eth",
          image: "raiden.dnp.dappnode.eth:0.0.2",
          logging: {
            options: {
              "max-size": "10m",
              "max-file": "3"
            }
          }
        }
      },
      volumes: {
        data: {
          driver_opts: {
            type: "none",
            device: devicePath,
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
    /* eslint-enable @typescript-eslint/camelcase */

    expect(getCustomVolumeDevicePaths([sampleCompose])).to.deep.equal([
      devicePath
    ]);
  });
});
