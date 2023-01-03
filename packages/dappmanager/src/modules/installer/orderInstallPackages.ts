import params from "../../params";
import { InstallPackageData } from "@dappnode/common";

const dappmanager = params.dappmanagerDnpName;

/**
 * Order the packages to be installed.
 * This is critical when packages are `docker-compose up`:
 * - On CORE updates the order can potentially unstuck critical bugs
 * - On CORE updates the order can improve the user experience alerting
 *   the user when certain components will go offline (vpn, dappmanager)
 * - On regular installs the may be package interdependencies such as
 *   volumes, so the packages have to be ordered
 * @param packagesData
 */
export default function orderInstallPackages(
  packagesData: InstallPackageData[],
  requestName: string
): InstallPackageData[] {
  // Generic order, by name and the dappmanager the last
  const basicOrder = packagesData
    .sort((a, b) => a.dnpName.localeCompare(b.dnpName))
    .sort((a, b) => {
      if (a.dnpName === dappmanager && b.dnpName !== dappmanager) return 1;
      if (a.dnpName !== dappmanager && b.dnpName === dappmanager) return -1;
      else return 0;
    });

  // The requested package can provide an order to up the packages
  // runOrder: ["core.dnp.dappnode.eth", "dappmanager.dnp.dappnode.eth"]
  // Which will overwrite the basic order in the trailing part
  const requestPkg = packagesData.find(pkg => pkg.dnpName === requestName);
  if (requestPkg && requestPkg.metadata.runOrder) {
    const runOrder = requestPkg.metadata.runOrder;
    return basicOrder.sort(
      (a, b) => runOrder.indexOf(a.dnpName) - runOrder.indexOf(b.dnpName)
    );
  }

  // Order by volume dependencies

  return basicOrder;
}
