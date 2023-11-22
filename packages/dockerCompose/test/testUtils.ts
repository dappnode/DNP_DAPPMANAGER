import { Compose } from "@dappnode/common";

export const mockDnpName = "mock-dnp.dnp.dappnode.eth";
export const mockDnpVersion = "0.0.0";

export const mockCompose: Compose = {
  version: "3.5",
  services: {
    [mockDnpName]: {
      image: `${mockDnpName}:${mockDnpVersion}`,
      container_name: `DAppNodePackage-${mockDnpName}`,
    },
  },
};
