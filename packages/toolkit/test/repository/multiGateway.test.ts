import { expect } from "chai";
import { DappnodeRepository } from "../../src/index.js";
import { JsonRpcApiProvider } from "ethers";

describe("Multi-gateway IPFS", function () {
  // Use null as provider since we're only testing the constructor and methods
  const mockProvider = null as JsonRpcApiProvider;

  it("Should support multiple gateways in constructor", function () {
    const gateways = ["http://gateway1.example.com", "http://gateway2.example.com"];
    const repo = new DappnodeRepository(gateways, mockProvider);
    
    // The constructor should accept arrays
    expect(repo).to.be.instanceOf(DappnodeRepository);
  });
  
  it("Should support single gateway for backward compatibility", function () {
    const gateway = "http://gateway.example.com";
    const repo = new DappnodeRepository(gateway, mockProvider);
    
    // The constructor should still accept single strings
    expect(repo).to.be.instanceOf(DappnodeRepository);
  });

  it("Should support changing gateways with arrays", function () {
    const repo = new DappnodeRepository("http://initial.example.com", mockProvider);
    const newGateways = ["http://new1.example.com", "http://new2.example.com"];
    
    // Should not throw
    repo.changeIpfsGatewayUrl(newGateways);
  });

  it("Should support changing gateways with strings", function () {
    const repo = new DappnodeRepository(["http://initial.example.com"], mockProvider);
    const newGateway = "http://new.example.com";
    
    // Should not throw 
    repo.changeIpfsGatewayUrl(newGateway);
  });
});