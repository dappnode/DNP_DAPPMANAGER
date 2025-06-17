import { ExposableServiceInfo, HttpsPortalMapping, Routes } from "@dappnode/types";

const mappings = new Map<string, HttpsPortalMapping>();

const exposable: ExposableServiceInfo[] = [
  {
    fromSubdomain: "geth",
    dnpName: "geth.dnp.dappnode.eth",
    serviceName: "geth.dnp.dappnode.eth",
    port: 8545,
    name: "Geth JSON RPC",
    description: "JSON RPC endpoint for Geth mainnet",
    external: true
  }
];

export const httpsPortal: Pick<
  Routes,
  | "httpsPortalPwaMappingAdd"
  | "httpsPortalMappingAdd"
  | "httpsPortalMappingRemove"
  | "httpsPortalMappingsGet"
  | "httpsPortalExposableServicesGet"
  | "httpsPortalMappingsRecreate"
> = {
  httpsPortalPwaMappingAdd: async () => {
    const pwaMapping: HttpsPortalMapping = {
      fromSubdomain: "pwa",
      dnpName: "pwa.dnp.dappnode.eth",
      serviceName: "pwa",
      port: 443,
      external: false
    };
    mappings.set(pwaMapping.fromSubdomain, pwaMapping);
  },
  httpsPortalMappingAdd: async ({ mapping }) => {
    mappings.set(mapping.fromSubdomain, mapping);
  },
  httpsPortalMappingRemove: async ({ mapping }) => {
    mappings.delete(mapping.fromSubdomain);
  },
  httpsPortalMappingsGet: async () => Array.from(mappings.values()),
  httpsPortalExposableServicesGet: async () => {
    const mappingsById = new Map(Array.from(mappings.values()).map((mapping) => [getId(mapping), mapping]));

    return exposable.map((mapping) => {
      const exposedMapping = mappingsById.get(getId(mapping));
      if (exposedMapping) {
        return { ...exposedMapping, ...mapping, exposed: true };
      } else {
        return { ...mapping, exposed: false };
      }
    });
  },
  httpsPortalMappingsRecreate: async () => {}
};

/** Helper to uniquely identify mapping target services */
function getId(mapping: Omit<HttpsPortalMapping, "fromSubdomain">): string {
  return `${mapping.dnpName} ${mapping.serviceName} ${mapping.port}`;
}
