import { expect } from "chai";
import { parseExposableServiceManifest } from "../../../../src/modules/https-portal/exposable/parseExposable";
import {
  ExposableServiceInfo,
  ExposableServiceManifestInfo,
  InstalledPackageData
} from "@dappnode/common";
import { mockContainer, mockDnp } from "../../../testUtils";

describe("modules / https-portal / exposable", () => {
  it("Should parse manifest.exposable", () => {
    const manifestExposable: ExposableServiceManifestInfo[] = [
      { name: "name1", port: 1111 },
      { broken: true } as unknown as ExposableServiceManifestInfo,
      { name: "name3", description: "desc3", serviceName: "serv3", port: 3333 }
    ];

    const dnpName = "mock-dnp.dnp.dappnode.eth";
    const serviceName = dnpName;
    const dnp: InstalledPackageData = {
      ...mockDnp,
      dnpName,
      containers: [{ ...mockContainer, serviceName }]
    };

    const expectedExposable: ExposableServiceInfo[] = [
      {
        fromSubdomain: "mock-dnp",
        name: "name1",
        description: "",
        dnpName: "mock-dnp.dnp.dappnode.eth",
        serviceName: "mock-dnp.dnp.dappnode.eth",
        port: 1111
      },
      {
        fromSubdomain: "serv-mock-dnp",
        name: "name3",
        description: "desc3",
        dnpName: "mock-dnp.dnp.dappnode.eth",
        serviceName: "serv3",
        port: 3333
      }
    ];

    const exposable = parseExposableServiceManifest(dnp, manifestExposable);

    expect(exposable).to.deep.equal(expectedExposable);
  });
});
