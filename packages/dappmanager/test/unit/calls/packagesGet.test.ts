import { expect } from "chai";
import { sortPackages } from "../../../src/calls/packagesGet";
import { InstalledPackageData } from "@dappnode/common";
import { mockContainer, mockDnp } from "../../testUtils";

describe("sortPackages for UI display", () => {
  it("Should sort packages", () => {
    const sampleDnps: MockDnp[] = [
      {
        dnpName: "b",
        containers: []
      },
      {
        dnpName: "a",
        containers: [
          { serviceName: "c", isMain: false },
          { serviceName: "b", isMain: true },
          { serviceName: "a", isMain: false }
        ]
      }
    ];

    const expectedSortedDnps: MockDnp[] = [
      {
        dnpName: "a",
        containers: [
          { serviceName: "b", isMain: true },
          { serviceName: "a", isMain: false },
          { serviceName: "c", isMain: false }
        ]
      },
      {
        dnpName: "b",
        containers: []
      }
    ];

    const sortedDnps = sortPackages(fromSampleDnps(sampleDnps));
    expect(toSampleDnps(sortedDnps)).to.deep.equal(expectedSortedDnps);
  });

  interface MockDnp {
    dnpName: string;
    containers: {
      serviceName: string;
      isMain: boolean;
    }[];
  }

  function fromSampleDnps(sampleDnps: MockDnp[]): InstalledPackageData[] {
    return sampleDnps.map(dnp => ({
      ...mockDnp,
      ...dnp,
      containers: dnp.containers.map(container => ({
        ...mockContainer,
        ...container
      }))
    }));
  }

  function toSampleDnps(dnps: InstalledPackageData[]): MockDnp[] {
    return dnps.map(dnp => ({
      dnpName: dnp.dnpName,
      containers: dnp.containers.map(container => ({
        serviceName: container.serviceName,
        isMain: container.isMain ?? false
      }))
    }));
  }
});
