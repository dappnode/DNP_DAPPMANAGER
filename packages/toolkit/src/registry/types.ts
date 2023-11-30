export type Registry = "dnp" | "public";

interface RegistryEntry {
  id: string;
  name: string;
  repo: string;
}

export interface PublicRegistryEntry extends RegistryEntry {
  RegistryPublic_id: string;
}

export interface DNPRegistryEntry extends RegistryEntry {
  Registry_id: string;
}
