import { ExposableServiceInfo, HttpsPortalMapping, Routes } from "../common";

const mappings = new Map<string, HttpsPortalMapping>();

const exposable: ExposableServiceInfo[] = [
  {
    dnpName: "geth.dnp.dappnode.eth",
    serviceName: "geth.dnp.dappnode.eth",
    port: 8545,
    name: "Geth JSON RPC",
    description: "JSON RPC endpoint for Geth mainnet"
  }
];

export const httpsPortal: Pick<
  Routes,
  | "httpsPortalMappingAdd"
  | "httpsPortalMappingRemove"
  | "httpsPortalMappingsGet"
  | "httpsPortalExposableServicesGet"
> = {
  httpsPortalMappingAdd: async mapping => {
    mappings.set(mapping.fromSubdomain, mapping);
  },
  httpsPortalMappingRemove: async mapping => {
    mappings.delete(mapping.fromSubdomain);
  },
  httpsPortalMappingsGet: async () => Array.from(mappings.values()),
  httpsPortalExposableServicesGet: async () => {
    const mappingsById = new Map(
      Array.from(mappings.values()).map(mapping => [getId(mapping), mapping])
    );

    return exposable.map(mapping => {
      const exposedMapping = mappingsById.get(getId(mapping));
      if (exposedMapping) {
        return { ...exposedMapping, ...mapping, exposed: true };
      } else {
        return { ...mapping, exposed: false };
      }
    });
  }
};

/** Helper to uniquely identify mapping target services */
function getId(mapping: Omit<HttpsPortalMapping, "fromSubdomain">): string {
  return `${mapping.dnpName} ${mapping.serviceName} ${mapping.port}`;
}
