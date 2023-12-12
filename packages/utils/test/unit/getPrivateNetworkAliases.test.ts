import { expect } from "chai";
import { getPrivateNetworkAliases } from "../../src/index.js";
import { params } from "@dappnode/params";

describe("getPrivateNetworkAliases", () => {
    it("should always return full network alias", () => {
        const container = {
            dnpName: "example.dnp.dappnode.eth",
            serviceName: "service",
            isMainOrMonoservice: false
        };
        const result = getPrivateNetworkAliases(container);
        expect(result).to.include("service.example.dappnode");
    });

    it("should return short network alias for main or monoservice containers", () => {
        const container = {
            dnpName: "example.dnp.dappnode.eth",
            serviceName: "service",
            isMainOrMonoservice: true
        };
        const result = getPrivateNetworkAliases(container);
        expect(result).to.include.members(["service.example.dappnode", "example.dappnode"]);
    });

    it("should include special aliases for the Admin UI", () => {
        const container = {
            dnpName: params.dappmanagerDnpName,
            serviceName: "dappmanager",
            isMainOrMonoservice: true
        };
        const result = getPrivateNetworkAliases(container);
        expect(result).to.include.members(["dappmanager.dappmanager.dappnode", "dappmanager.dappnode", ...params.DAPPMANAGER_ALIASES]);
    });

    it("should ensure uniqueness of aliases", () => {
        const container = {
            dnpName: "example.dnp.dappnode.eth",
            serviceName: "example",
            isMainOrMonoservice: true
        };
        const result = getPrivateNetworkAliases(container);
        const uniqueResult = [...new Set(result)];
        expect(result).to.have.lengthOf(uniqueResult.length);
    });

});
