import "mocha";
import { expect } from "chai";
import {
  getDevicePath,
  parseDevicePath,
  parseDevicePathMountpoint,
} from "../../src/index.js";

const pathParts = {
  mountpoint: "/dev1/data",
  dnpName: "bitcoin.dnp.dappnode.eth",
  volumeName: "data",
  volumePath: "bitcoin.dnp.dappnode.eth/data",
  mountpointPath: "/dev1/data/dappnode-volumes",
};
const devicePath = "/dev1/data/dappnode-volumes/bitcoin.dnp.dappnode.eth/data";

describe("device path", () => {
  it("Should get a device path", () => {
    expect(getDevicePath(pathParts)).to.equal(devicePath);
  });

  it("Should parse a device path", () => {
    expect(parseDevicePath(devicePath)).to.deep.equal(pathParts);
  });

  it("Should parse a device path mountpoint", () => {
    expect(parseDevicePathMountpoint(devicePath)).to.equal(
      pathParts.mountpoint
    );
  });
});
