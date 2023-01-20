import "mocha";
import { expect } from "chai";
import { ContainerLabelsRaw } from "../../../../src/types.js";
import { readContainerLabels } from "../../../../src/modules/compose.js";

describe("Parse and validate manifest labels to be used in the compose", () => {
  it("should parse and validate driver as a string", () => {
    const expectedLabels = {
      dnpName: "dnp-name",
      version: "1.0.0",
      serviceName: "service-name",
      instanceName: "instance-name",
      dependencies: { oneDependency: "dependency-name" },
      avatar: "avatar-url",
      origin: "origin-url",
      chain: "ethereum2-beacon-chain-prysm",
      isCore: true,
      isMain: true,
      dockerTimeout: 10,
      defaultEnvironment: ["ENV_VAR1=value1", "ENV_VAR2=value2"],
      defaultPorts: ["8080:8080", "8081:8081"],
      defaultVolumes: ["/var/log:/var/log"]
    };
    const labelsRaw: ContainerLabelsRaw = {
      "dappnode.dnp.dnpName": "dnp-name",
      "dappnode.dnp.version": "1.0.0",
      "dappnode.dnp.serviceName": "service-name",
      "dappnode.dnp.instanceName": "instance-name",
      "dappnode.dnp.dependencies": '{"oneDependency": "dependency-name"}',
      "dappnode.dnp.avatar": "avatar-url",
      "dappnode.dnp.origin": "origin-url",
      "dappnode.dnp.chain": "ethereum2-beacon-chain-prysm",
      "dappnode.dnp.isCore": "true",
      "dappnode.dnp.isMain": "true",
      "dappnode.dnp.dockerTimeout": "10",
      "dappnode.dnp.default.environment":
        '["ENV_VAR1=value1", "ENV_VAR2=value2"]',
      "dappnode.dnp.default.ports": '["8080:8080", "8081:8081"]',
      "dappnode.dnp.default.volumes": '["/var/log:/var/log"]'
    };
    const labelValues = readContainerLabels(labelsRaw);

    // Expect labelValues to be equal to expectedLabels
    expect(labelValues).to.deep.equal(expectedLabels);
  });

  it("should parse and validate driver as an object", () => {
    const expectedLabels = {
      dnpName: "dnp-name",
      version: "1.0.0",
      serviceName: "service-name",
      instanceName: "instance-name",
      dependencies: { oneDependency: "dependency-name" },
      avatar: "avatar-url",
      origin: "origin-url",
      chain: {
        driver: "ethereum2-beacon-chain-prysm"
      },
      isCore: true,
      isMain: true,
      dockerTimeout: 10,
      defaultEnvironment: ["ENV_VAR1=value1", "ENV_VAR2=value2"],
      defaultPorts: ["8080:8080", "8081:8081"],
      defaultVolumes: ["/var/log:/var/log"]
    };
    const labelsRaw: ContainerLabelsRaw = {
      "dappnode.dnp.dnpName": "dnp-name",
      "dappnode.dnp.version": "1.0.0",
      "dappnode.dnp.serviceName": "service-name",
      "dappnode.dnp.instanceName": "instance-name",
      "dappnode.dnp.dependencies": '{"oneDependency": "dependency-name"}',
      "dappnode.dnp.avatar": "avatar-url",
      "dappnode.dnp.origin": "origin-url",
      "dappnode.dnp.chain": '{"driver": "ethereum2-beacon-chain-prysm"}',
      "dappnode.dnp.isCore": "true",
      "dappnode.dnp.isMain": "true",
      "dappnode.dnp.dockerTimeout": "10",
      "dappnode.dnp.default.environment":
        '["ENV_VAR1=value1", "ENV_VAR2=value2"]',
      "dappnode.dnp.default.ports": '["8080:8080", "8081:8081"]',
      "dappnode.dnp.default.volumes": '["/var/log:/var/log"]'
    };
    const labelValues = readContainerLabels(labelsRaw);

    // Expect labelValues to be equal to expectedLabels
    expect(labelValues).to.deep.equal(expectedLabels);
  });

  it("should parse and validate driver as undefined", () => {
    const expectedLabels = {
      dnpName: "dnp-name",
      version: "1.0.0",
      serviceName: "service-name",
      instanceName: "instance-name",
      dependencies: { oneDependency: "dependency-name" },
      avatar: "avatar-url",
      origin: "origin-url",
      chain: undefined,
      isCore: true,
      isMain: true,
      dockerTimeout: 10,
      defaultEnvironment: ["ENV_VAR1=value1", "ENV_VAR2=value2"],
      defaultPorts: ["8080:8080", "8081:8081"],
      defaultVolumes: ["/var/log:/var/log"]
    };
    const labelsRaw: ContainerLabelsRaw = {
      "dappnode.dnp.dnpName": "dnp-name",
      "dappnode.dnp.version": "1.0.0",
      "dappnode.dnp.serviceName": "service-name",
      "dappnode.dnp.instanceName": "instance-name",
      "dappnode.dnp.dependencies": '{"oneDependency": "dependency-name"}',
      "dappnode.dnp.avatar": "avatar-url",
      "dappnode.dnp.origin": "origin-url",
      "dappnode.dnp.chain": '{"driverd": "ethereudm2-beacon-chain-prysm"}',
      "dappnode.dnp.isCore": "true",
      "dappnode.dnp.isMain": "true",
      "dappnode.dnp.dockerTimeout": "10",
      "dappnode.dnp.default.environment":
        '["ENV_VAR1=value1", "ENV_VAR2=value2"]',
      "dappnode.dnp.default.ports": '["8080:8080", "8081:8081"]',
      "dappnode.dnp.default.volumes": '["/var/log:/var/log"]'
    };
    const labelValues = readContainerLabels(labelsRaw);

    // Expect labelValues to be equal to expectedLabels
    expect(labelValues).to.deep.equal(expectedLabels);
  });
});
