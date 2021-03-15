import { ExposableServiceInfo } from "../../types";
import { listPackages } from "../docker/list";

const exposable: ExposableServiceInfo[] = [
  {
    dnpName: "geth.dnp.dappnode.eth",
    serviceName: "geth.dnp.dappnode.eth",
    port: 8545,
    name: "Geth JSON RPC",
    description: "JSON RPC endpoint for Geth mainnet"
  }
];

export async function getExposableServices(): Promise<ExposableServiceInfo[]> {
  const dnps = await listPackages();
  const dnpNames = new Set(dnps.map(dnp => dnp.dnpName));
  return exposable.filter(exp => dnpNames.has(exp.dnpName));
}
