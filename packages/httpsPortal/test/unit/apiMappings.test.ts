import { expect } from "chai";
import { HttpsPortalMapping } from "@dappnode/types";
import { HttpPortalEntry } from "../../src/apiClient.js";
import { hasApiMappingForContainer, hasExactApiMapping } from "../../src/apiMappings.js";
import { getExternalNetworkAlias } from "../../src/domains.js";

describe("modules / https-portal / api mappings", () => {
  const mapping: HttpsPortalMapping = {
    fromSubdomain: "first",
    dnpName: "mock-dnp.dnp.dappnode.eth",
    serviceName: "mock-service",
    port: 8080,
    external: true
  };
  const toHost = `${getExternalNetworkAlias(mapping)}:${mapping.port}`;
  const entries: HttpPortalEntry[] = [
    {
      fromSubdomain: mapping.fromSubdomain,
      toHost,
      external: mapping.external
    }
  ];

  it("finds an exact existing mapping", () => {
    expect(hasExactApiMapping(entries, mapping)).to.equal(true);
  });

  it("allows another subdomain to map to the same container and port", () => {
    expect(hasExactApiMapping(entries, { ...mapping, fromSubdomain: "second" })).to.equal(false);
  });

  it("allows another port on the same container to be mapped", () => {
    expect(hasExactApiMapping(entries, { ...mapping, fromSubdomain: "second", port: 9090 })).to.equal(false);
  });

  it("does not treat a conflicting subdomain pointing elsewhere as the same mapping", () => {
    expect(hasExactApiMapping(entries, { ...mapping, port: 9090 })).to.equal(false);
  });

  it("detects whether a container has any mapping", () => {
    expect(hasApiMappingForContainer(entries, mapping.dnpName, mapping.serviceName)).to.equal(true);
    expect(hasApiMappingForContainer(entries, mapping.dnpName, "other-service")).to.equal(false);
  });
});
