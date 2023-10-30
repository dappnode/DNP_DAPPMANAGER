import { ManifestWithImage } from "@dappnode/common";
import { Compose, Manifest } from "@dappnode/types";

export const mockDnpName = "mock-dnp.dnp.dappnode.eth";
export const mockDnpVersion = "0.0.0";
export const mockSize = 1111111;

export const mockHash = "/ipfs/QmWkAVYJhpwqApRfK4SZ6e2Xt2Daamc8uBpM1oMLmQ6fw4";

export const mockCompose: Compose = {
  version: "3.5",
  services: {
    [mockDnpName]: {
      image: `${mockDnpName}:${mockDnpVersion}`,
      container_name: `DAppNodePackage-${mockDnpName}`,
    },
  },
};

export const mockManifest: Manifest = {
  name: mockDnpName,
  version: "0.0.0",
  description: "Mock description",
  type: "service",
  avatar: mockHash,
  dependencies: {},
  license: "Mock-license",
};

export const mockManifestWithImage: ManifestWithImage = {
  ...mockManifest,
  image: {
    hash: mockHash,
    path: "mock/mock/mock.mock",
    size: mockSize,
  },
};
