import { getPrivateNetworkAlias } from "../../src/domains";
import params from "../../src/params";

export const dappmanagerTestApiUrl = `http://${getPrivateNetworkAlias({
  dnpName: params.dappmanagerDnpName,
  serviceName: params.dappmanagerDnpName
})}:${params.TEST_API_PORT}`;
