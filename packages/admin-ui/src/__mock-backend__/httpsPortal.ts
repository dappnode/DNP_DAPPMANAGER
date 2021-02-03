import { HttpsPortalMapping, Routes } from "../common";

const mappings = new Map<string, HttpsPortalMapping>();

export const httpsPortal: Pick<
  Routes,
  | "httpsPortalMappingAdd"
  | "httpsPortalMappingRemove"
  | "httpsPortalMappingsGet"
> = {
  httpsPortalMappingAdd: async ({ mapping }) => {
    mappings.set(mapping.fromSubdomain, mapping);
  },
  httpsPortalMappingRemove: async ({ mapping }) => {
    mappings.delete(mapping.fromSubdomain);
  },
  httpsPortalMappingsGet: async () => Array.from(mappings.values())
};
