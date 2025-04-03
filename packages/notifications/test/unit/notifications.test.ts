import "mocha";
import { expect } from "chai";

import { NotificationsManifest } from "../../src/manifest.js";
import { NotificationsConfig, Alert } from "@dappnode/types";

// Dummy objects to satisfy required properties.
const dummyAlert: Alert = {
  type: "custom",
  "failure-threshold": 2,
  "success-threshold": 1,
  "send-on-resolved": true,
  description: "Dummy alert",
  enabled: true
};

const dummyDefinition = {
  title: "Dummy Title",
  description: "Dummy Description"
};

const dummyMetric = {
  min: 0,
  max: 100,
  unit: "%"
};

describe("applyPreviousEndpoints", () => {
  let merger: NotificationsManifest;

  beforeEach(() => {
    merger = new NotificationsManifest();
  });

  it("should return new config when old config is null", () => {
    const newConfig: NotificationsConfig = {
      endpoints: [
        {
          name: "Test Endpoint",
          enabled: true,
          url: "http://example.com",
          method: "GET",
          conditions: ["[BODY].value < 80"],
          interval: "30s",
          group: "host",
          alerts: [dummyAlert],
          definition: dummyDefinition,
          metric: dummyMetric
        }
      ],
      customEndpoints: [
        {
          name: "Test Custom",
          enabled: true,
          description: "Test custom endpoint",
          metric: { treshold: 50, min: 0, max: 100, unit: "%" }
        }
      ]
    };

    const result = merger.applyPreviousEndpoints("dnp", true, newConfig, null);
    expect(result).to.deep.equal(newConfig);
  });

  it("should return new config when old config is undefined", () => {
    const newConfig: NotificationsConfig = {
      endpoints: [
        {
          name: "Test Endpoint",
          enabled: true,
          url: "http://example.com",
          method: "GET",
          conditions: ["[BODY].value < 80"],
          interval: "30s",
          group: "host",
          alerts: [dummyAlert],
          definition: dummyDefinition,
          metric: dummyMetric
        }
      ],
      customEndpoints: [
        {
          name: "Test Custom",
          enabled: true,
          description: "Test custom endpoint",
          metric: { treshold: 50, min: 0, max: 100, unit: "%" }
        }
      ]
    };

    const result = merger.applyPreviousEndpoints("dnp", true, newConfig);
    expect(result).to.deep.equal(newConfig);
  });

  it("should merge enabled flag and condition right-hand side for matching endpoints", () => {
    const newConfig: NotificationsConfig = {
      endpoints: [
        {
          name: "High CPU Usage Check",
          enabled: true,
          url: "http://cpu.example.com",
          method: "GET",
          conditions: ["[BODY].data.result[0].value[1] < 80"],
          interval: "30s",
          group: "host",
          alerts: [dummyAlert],
          definition: dummyDefinition,
          metric: dummyMetric
        }
      ],
      customEndpoints: []
    };

    const oldConfig: NotificationsConfig = {
      endpoints: [
        {
          name: "High CPU Usage Check",
          enabled: false,
          url: "http://cpu.example.com",
          method: "GET",
          conditions: ["[BODY].data.result[0].value[1] < 75"],
          interval: "30s",
          group: "host",
          alerts: [dummyAlert],
          definition: dummyDefinition,
          metric: dummyMetric
        }
      ],
      customEndpoints: []
    };

    const result = merger.applyPreviousEndpoints("dnp", true, newConfig, oldConfig);
    expect(result.endpoints).to.have.lengthOf(1);
    const mergedEndpoint = result.endpoints![0];
    // The endpoint's enabled flag should be from the old config.
    expect(mergedEndpoint.enabled).to.equal(false);
    // The condition's right-hand side should be taken from the old config.
    expect(mergedEndpoint.conditions[0]).to.equal("[BODY].data.result[0].value[1] < 75");
  });

  it("should merge custom endpoint enabled flag and metric.treshold", () => {
    const newConfig: NotificationsConfig = {
      endpoints: [],
      customEndpoints: [
        {
          name: "Custom Check",
          enabled: true,
          description: "Custom check description",
          metric: { treshold: 50, min: 0, max: 100, unit: "%" }
        }
      ]
    };

    const oldConfig: NotificationsConfig = {
      endpoints: [],
      customEndpoints: [
        {
          name: "Custom Check",
          enabled: false,
          description: "Custom check description",
          metric: { treshold: 25, min: 0, max: 100, unit: "%" }
        }
      ]
    };

    const result = merger.applyPreviousEndpoints("dnp", true, newConfig, oldConfig);
    expect(result.customEndpoints).to.have.lengthOf(1);
    const mergedCustom = result.customEndpoints![0];
    expect(mergedCustom.enabled).to.equal(false);
    expect(mergedCustom.metric?.treshold).to.equal(25);
  });

  it("should ignore old endpoints that are not present in new config", () => {
    const newConfig: NotificationsConfig = {
      endpoints: [
        {
          name: "New Endpoint",
          enabled: true,
          url: "http://new.example.com",
          method: "GET",
          conditions: ["[BODY].value < 50"],
          interval: "30s",
          group: "host",
          alerts: [dummyAlert],
          definition: dummyDefinition,
          metric: dummyMetric
        }
      ],
      customEndpoints: []
    };

    const oldConfig: NotificationsConfig = {
      endpoints: [
        {
          name: "Old Endpoint",
          enabled: false,
          url: "http://old.example.com",
          method: "GET",
          conditions: ["[BODY].value < 30"],
          interval: "30s",
          group: "host",
          alerts: [dummyAlert],
          definition: dummyDefinition,
          metric: dummyMetric
        }
      ],
      customEndpoints: []
    };

    const result = merger.applyPreviousEndpoints("dnp", true, newConfig, oldConfig);
    expect(result.endpoints).to.have.lengthOf(1);
    expect(result.endpoints![0].name).to.equal("New Endpoint");
  });

  it("should handle malformed condition gracefully", () => {
    const newConfig: NotificationsConfig = {
      endpoints: [
        {
          name: "Malformed Condition Endpoint",
          enabled: true,
          url: "http://malformed.example.com",
          method: "GET",
          conditions: ["malformed condition"],
          interval: "30s",
          group: "host",
          alerts: [dummyAlert],
          definition: dummyDefinition,
          metric: dummyMetric
        }
      ],
      customEndpoints: []
    };

    const oldConfig: NotificationsConfig = {
      endpoints: [
        {
          name: "Malformed Condition Endpoint",
          enabled: false,
          url: "http://malformed.example.com",
          method: "GET",
          conditions: ["ignored condition"],
          interval: "30s",
          group: "host",
          alerts: [dummyAlert],
          definition: dummyDefinition,
          metric: dummyMetric
        }
      ],
      customEndpoints: []
    };

    const result = merger.applyPreviousEndpoints("dnp", true, newConfig, oldConfig);
    // Since the condition does not split into three parts, it should remain unchanged.
    expect(result.endpoints![0].conditions[0]).to.equal("malformed condition");
  });

  it("should handle different lengths of conditions arrays", () => {
    const newConfig: NotificationsConfig = {
      endpoints: [
        {
          name: "Multiple Conditions Endpoint",
          enabled: true,
          url: "http://multiple.example.com",
          method: "GET",
          conditions: ["[BODY].data[0] < 80", "[BODY].data[1] > 20"],
          interval: "30s",
          group: "host",
          alerts: [dummyAlert],
          definition: dummyDefinition,
          metric: dummyMetric
        }
      ],
      customEndpoints: []
    };

    const oldConfig: NotificationsConfig = {
      endpoints: [
        {
          name: "Multiple Conditions Endpoint",
          enabled: false,
          url: "http://multiple.example.com",
          method: "GET",
          conditions: [
            "[BODY].data[0] < 75" // Only one condition in the old config.
          ],
          interval: "30s",
          group: "host",
          alerts: [dummyAlert],
          definition: dummyDefinition,
          metric: dummyMetric
        }
      ],
      customEndpoints: []
    };

    const result = merger.applyPreviousEndpoints("dnp", true, newConfig, oldConfig);
    expect(result.endpoints![0].conditions[0]).to.equal("[BODY].data[0] < 75");
    expect(result.endpoints![0].conditions[1]).to.equal("[BODY].data[1] > 20");
  });

  it("should merge multiple endpoints and custom endpoints correctly", () => {
    const newConfig: NotificationsConfig = {
      endpoints: [
        {
          name: "High CPU Usage Check",
          enabled: true,
          url: "http://cpu.example.com",
          method: "GET",
          conditions: ["[BODY].cpu < 80"],
          interval: "30s",
          group: "host",
          alerts: [dummyAlert],
          definition: dummyDefinition,
          metric: dummyMetric
        },
        {
          name: "Host out of memory check",
          enabled: true,
          url: "http://memory.example.com",
          method: "GET",
          conditions: ["[BODY].memory > 10"],
          interval: "30s",
          group: "host",
          alerts: [dummyAlert],
          definition: dummyDefinition,
          metric: dummyMetric
        }
      ],
      customEndpoints: [
        {
          name: "Custom Check A",
          enabled: true,
          description: "Custom Check A description",
          metric: { treshold: 50, min: 0, max: 100, unit: "%" }
        },
        {
          name: "Custom Check B",
          enabled: true,
          description: "Custom Check B description",
          metric: { treshold: 60, min: 0, max: 100, unit: "%" }
        }
      ]
    };

    const oldConfig: NotificationsConfig = {
      endpoints: [
        {
          name: "High CPU Usage Check",
          enabled: false,
          url: "http://cpu.example.com",
          method: "GET",
          conditions: ["[BODY].cpu < 70"],
          interval: "30s",
          group: "host",
          alerts: [dummyAlert],
          definition: dummyDefinition,
          metric: dummyMetric
        },
        {
          name: "Host out of memory check",
          enabled: false,
          url: "http://memory.example.com",
          method: "GET",
          conditions: ["[BODY].memory > 20"],
          interval: "30s",
          group: "host",
          alerts: [dummyAlert],
          definition: dummyDefinition,
          metric: dummyMetric
        },
        {
          name: "Obsolete Endpoint",
          enabled: false,
          url: "http://obsolete.example.com",
          method: "GET",
          conditions: ["[BODY].obsolete < 10"],
          interval: "30s",
          group: "host",
          alerts: [dummyAlert],
          definition: dummyDefinition,
          metric: dummyMetric
        }
      ],
      customEndpoints: [
        {
          name: "Custom Check A",
          enabled: false,
          description: "Custom Check A description",
          metric: { treshold: 40, min: 0, max: 100, unit: "%" }
        }
        // "Custom Check B" does not exist in the old config.
      ]
    };

    const result = merger.applyPreviousEndpoints("dnp", true, newConfig, oldConfig);

    // Verify endpoints merging.
    expect(result.endpoints).to.have.lengthOf(2);
    const cpuEndpoint = result.endpoints!.find((e) => e.name === "High CPU Usage Check");
    const memEndpoint = result.endpoints!.find((e) => e.name === "Host out of memory check");
    expect(cpuEndpoint?.enabled).to.equal(false);
    expect(cpuEndpoint?.conditions[0]).to.equal("[BODY].cpu < 70");
    expect(memEndpoint?.enabled).to.equal(false);
    expect(memEndpoint?.conditions[0]).to.equal("[BODY].memory > 20");

    // Verify custom endpoints merging.
    expect(result.customEndpoints).to.have.lengthOf(2);
    const customA = result.customEndpoints!.find((e) => e.name === "Custom Check A");
    const customB = result.customEndpoints!.find((e) => e.name === "Custom Check B");
    expect(customA?.enabled).to.equal(false);
    expect(customA?.metric?.treshold).to.equal(40);
    // Custom Check B remains as defined in the new config.
    expect(customB?.enabled).to.equal(true);
    expect(customB?.metric?.treshold).to.equal(60);
  });
});
