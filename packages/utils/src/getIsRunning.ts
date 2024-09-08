import { InstalledPackageData } from "@dappnode/types";

/**
 * Returns true if the package is running or false if not
 * For web3signer, it does not take into account the container "flyway" which may not be running
 */
export function getIsRunning({ dnpName }: { dnpName: string }, dnpList: InstalledPackageData[]): boolean {
  const flywayServiceName = "flyway";
  const isSigner = dnpName.includes("web3signer");
  const dnp = dnpList.find((dnp) => dnp.dnpName === dnpName);
  if (dnp) {
    if (isSigner) return dnp.containers.filter((c) => c.serviceName !== flywayServiceName).every((c) => c.running);
    else return dnp.containers.every((c) => c.running);
  }
  return false;
}
