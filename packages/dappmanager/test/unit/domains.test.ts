import { expect } from "chai";
import { determineNetworkAlias } from "../../src/domains.js";

describe('determineNetworkAlias', () => {

  describe('DNP packages', () => {
    
    it('should return short network alias for main or monoservice, not external containers', () => {
      const result = determineNetworkAlias({
        dnpName: "dappmanager.dnp.dappnode.eth",
        serviceName: "serviceName",
        isMainOrMonoservice: true
      });
      expect(result).to.equal('dappmanager.dappnode');
    });

    it('should return full network alias for non-main or non-monoservice, not external containers', () => {
      const result = determineNetworkAlias({
        dnpName: "dappmanager.dnp.dappnode.eth",
        serviceName: "serviceName",
        isMainOrMonoservice: false
      });
      expect(result).to.equal('serviceName.dappmanager.dappnode');
    });

    it('should return short network alias for main or monoservice, external containers', () => {
      const result = determineNetworkAlias({
        dnpName: "dappmanager.dnp.dappnode.eth",
        serviceName: "serviceName",
        isMainOrMonoservice: true,
        isExternal: true
      });
      expect(result).to.equal('dappmanager.dappnode.external');
    });

    it('should return full network alias for non-main or non-monoservice, external containers', () => {
      const result = determineNetworkAlias({
        dnpName: "dappmanager.dnp.dappnode.eth",
        serviceName: "serviceName",
        isMainOrMonoservice: false,
        isExternal: true
      });
      expect(result).to.equal('serviceName.dappmanager.dappnode.external');
    });

  });

  describe('Public packages', () => {

    it('should return short network alias for main or monoservice, not external containers with ".public.dappnode.eth"', () => {
      const result = determineNetworkAlias({
        dnpName: "dappmanager.public.dappnode.eth",
        serviceName: "serviceName",
        isMainOrMonoservice: true
      });
      expect(result).to.equal('dappmanager.public.dappnode');
    });

    it('should return full network alias for non-main or non-monoservice, not external containers with ".public.dappnode.eth"', () => {
      const result = determineNetworkAlias({
        dnpName: "dappmanager.public.dappnode.eth",
        serviceName: "serviceName",
        isMainOrMonoservice: false
      });
      expect(result).to.equal('serviceName.dappmanager.public.dappnode');
    });

    it('should return short network alias for main or monoservice, external containers with ".public.dappnode.eth"', () => {
      const result = determineNetworkAlias({
        dnpName: "dappmanager.public.dappnode.eth",
        serviceName: "serviceName",
        isMainOrMonoservice: true,
        isExternal: true
      });
      expect(result).to.equal('dappmanager.public.dappnode.external');
    });

    it('should return full network alias for non-main or non-monoservice, external containers with ".public.dappnode.eth"', () => {
      const result = determineNetworkAlias({
        dnpName: "dappmanager.public.dappnode.eth",
        serviceName: "serviceName",
        isMainOrMonoservice: false,
        isExternal: true
      });
      expect(result).to.equal('serviceName.dappmanager.public.dappnode.external');
    });

  });

  describe('Different dnpNames', () => {

    it('should handle different dnpName formats ending with .dappnode.eth', () => {
      const result = determineNetworkAlias({
        dnpName: "example.dappnode.eth",
        serviceName: "serviceName",
        isMainOrMonoservice: false
      });
      expect(result).to.equal('serviceName.example.dappnode');
    });

    it('should handle different dnpName formats ending with .eth', () => {
      const result = determineNetworkAlias({
        dnpName: "example.eth",
        serviceName: "serviceName",
        isMainOrMonoservice: false
      });
      expect(result).to.equal('serviceName.example.dappnode');
    });

    it('should handle dnpName with underscores', () => {
      const result = determineNetworkAlias({
        dnpName: "example_name.dnp.dappnode.eth",
        serviceName: "serviceName",
        isMainOrMonoservice: false
      });
      expect(result).to.equal('serviceName.examplename.dappnode');
    });

  });
});
