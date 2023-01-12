import "mocha";
import { expect } from "chai";
import { InstallPackageData } from "@dappnode/common";
import { mockPackageData } from "../../../testUtils";

import orderInstallPackages from "../../../../src/modules/installer/orderInstallPackages";

describe("Module > Installer", () => {
  describe("orderInstallPackages", () => {
    function getPackagesData(names: string[]): InstallPackageData[] {
      return names.map(dnpName => ({
        ...mockPackageData,
        dnpName
      }));
    }
    const coreName = "core.dnp.dappnode.eth";
    const dappmanagerName = "dappmanager.dnp.dappnode.eth";

    it("Should order by alphabetic order and the dappmanager last", () => {
      const packagesData = getPackagesData([
        coreName,
        "bind.dnp.dappnode.eth",
        "ipfs.dnp.dappnode.eth",
        "ethforward.dnp.dappnode.eth",
        "vpn.dnp.dappnode.eth",
        "wamp.dnp.dappnode.eth",
        "admin.dnp.dappnode.eth",
        dappmanagerName,
        "wifi.dnp.dappnode.eth"
      ]);

      const expectedOrderedPackagesData = [
        "admin.dnp.dappnode.eth",
        "bind.dnp.dappnode.eth",
        coreName,
        "ethforward.dnp.dappnode.eth",
        "ipfs.dnp.dappnode.eth",
        "vpn.dnp.dappnode.eth",
        "wamp.dnp.dappnode.eth",
        "wifi.dnp.dappnode.eth",
        dappmanagerName
      ];

      const orderedPackagesData = orderInstallPackages(
        packagesData,
        coreName
      ).map(({ dnpName }) => dnpName);
      expect(orderedPackagesData).to.deep.equal(expectedOrderedPackagesData);
    });

    it("Should order with a provided partial runOrder", () => {
      const runOrder: string[] = [coreName, dappmanagerName];

      const packagesData = getPackagesData([
        coreName,
        "bind.dnp.dappnode.eth",
        "ipfs.dnp.dappnode.eth",
        "ethforward.dnp.dappnode.eth",
        "vpn.dnp.dappnode.eth",
        "wamp.dnp.dappnode.eth",
        "admin.dnp.dappnode.eth",
        dappmanagerName,
        "wifi.dnp.dappnode.eth"
      ]).map(pkg => {
        if (pkg.dnpName === coreName)
          return {
            ...pkg,
            metadata: {
              ...pkg.metadata,
              runOrder
            }
          };
        else return pkg;
      });

      const expectedOrderedPackagesData = [
        "admin.dnp.dappnode.eth",
        "bind.dnp.dappnode.eth",
        "ethforward.dnp.dappnode.eth",
        "ipfs.dnp.dappnode.eth",
        "vpn.dnp.dappnode.eth",
        "wamp.dnp.dappnode.eth",
        "wifi.dnp.dappnode.eth",
        coreName,
        dappmanagerName
      ];

      const orderedPackagesData = orderInstallPackages(
        packagesData,
        coreName
      ).map(({ dnpName }) => dnpName);
      expect(orderedPackagesData).to.deep.equal(expectedOrderedPackagesData);
    });

    it("Should order with a provided full runOrder", () => {
      const runOrder: string[] = [
        coreName,
        "admin.dnp.dappnode.eth",
        "bind.dnp.dappnode.eth",
        "ethforward.dnp.dappnode.eth",
        "ipfs.dnp.dappnode.eth",
        "wamp.dnp.dappnode.eth",
        "wifi.dnp.dappnode.eth",
        "vpn.dnp.dappnode.eth",
        dappmanagerName
      ];

      const packagesData = getPackagesData([
        coreName,
        "bind.dnp.dappnode.eth",
        "ipfs.dnp.dappnode.eth",
        "ethforward.dnp.dappnode.eth",
        "vpn.dnp.dappnode.eth",
        "wamp.dnp.dappnode.eth",
        "admin.dnp.dappnode.eth",
        dappmanagerName,
        "wifi.dnp.dappnode.eth"
      ]).map(pkg => {
        if (pkg.dnpName === coreName)
          return {
            ...pkg,
            metadata: {
              ...pkg.metadata,
              runOrder
            }
          };
        else return pkg;
      });

      const orderedPackagesData = orderInstallPackages(
        packagesData,
        coreName
      ).map(({ dnpName }) => dnpName);
      expect(orderedPackagesData).to.deep.equal(runOrder);
    });
  });
});
