import "mocha";
import { expect } from "chai";

import { NotificationsManifest } from "../../src/manifest.js";
import { NotificationsConfig, Alert, Priority } from "@dappnode/types";

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
          isBanner: false,
          correlationId: "Test Endpoint",
          priority: Priority.medium,
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
          correlationId: "Test Custom",
          enabled: true,
          isBanner: false,
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
          isBanner: false,
          correlationId: "Test Endpoint",
          priority: Priority.medium,
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
          correlationId: "Test Custom",
          enabled: true,
          isBanner: false,
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
          isBanner: false,
          correlationId: "High CPU Usage Check",
          priority: Priority.medium,
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
          isBanner: false,
          correlationId: "High CPU Usage Check",
          priority: Priority.medium,
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
          correlationId: "Custom Check",
          enabled: true,
          isBanner: false,
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
          correlationId: "Custom Check",
          enabled: false,
          isBanner: false,
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
          isBanner: false,
          correlationId: "New Endpoint",
          priority: Priority.medium,
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
          isBanner: false,
          correlationId: "Old Endpoint",
          priority: Priority.medium,
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
          isBanner: false,
          correlationId: "Malformed Condition Endpoint",
          priority: Priority.medium,
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
          isBanner: false,
          correlationId: "Malformed Condition Endpoint",
          priority: Priority.medium,
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
          isBanner: false,
          correlationId: "Multiple Conditions Endpoint",
          priority: Priority.medium,
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
          isBanner: false,
          correlationId: "Multiple Conditions Endpoint",
          priority: Priority.medium,
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
          isBanner: false,
          correlationId: "dms-host-cpu-check",
          priority: Priority.medium,
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
          isBanner: false,
          correlationId: "dms-host-out-of-memory-check",
          priority: Priority.medium,
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
          correlationId: "custom-check-a",
          enabled: true,
          isBanner: false,
          description: "Custom Check A description",
          metric: { treshold: 50, min: 0, max: 100, unit: "%" }
        },
        {
          name: "Custom Check B",
          correlationId: "custom-check-b",
          enabled: true,
          isBanner: false,
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
          isBanner: false,
          correlationId: "dms-host-cpu-check",
          priority: Priority.medium,
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
          isBanner: false,
          correlationId: "dms-host-out-of-memory-check",
          priority: Priority.medium,
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
          isBanner: false,
          correlationId: "Obsolete Endpoint",
          priority: Priority.medium,
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
          isBanner: false,
          correlationId: "custom-check-a",
          description: "Custom Check A description",
          metric: { treshold: 40, min: 0, max: 100, unit: "%" }
        }
        // "Custom Check B" does not exist in the old config.
      ]
    };

    const result = merger.applyPreviousEndpoints("dnp", true, newConfig, oldConfig);

    // Verify endpoints merging.
    expect(result.endpoints).to.have.lengthOf(2);
    const cpuEndpoint = result.endpoints!.find((e) => e.correlationId === "dms-host-cpu-check");
    const memEndpoint = result.endpoints!.find((e) => e.correlationId === "dms-host-out-of-memory-check");
    expect(cpuEndpoint?.enabled, "merged CPU endpoint enabled").to.equal(false);
    expect(cpuEndpoint?.conditions[0], "merged CPU endpoint threshold").to.equal("[BODY].cpu < 70");
    expect(memEndpoint?.enabled, "merged memory endpoint enabled").to.equal(false);
    expect(memEndpoint?.conditions[0], "merged memory endpoint threshold").to.equal("[BODY].memory > 20");

    // Verify custom endpoints merging.
    expect(result.customEndpoints).to.have.lengthOf(2);
    const customA = result.customEndpoints!.find((e) => e.correlationId === "custom-check-a");
    const customB = result.customEndpoints!.find((e) => e.correlationId === "custom-check-b");
    expect(customA?.enabled, "merged Custom Check A enabled").to.equal(false);
    expect(customA?.metric?.treshold, "merged Custom Check A threshold").to.equal(40);
    // Custom Check B remains as defined in the new config.
    expect(customB?.enabled, "merged Custom Check B enabled").to.equal(true);
    expect(customB?.metric?.treshold, "merged Custom Check B threshold").to.equal(60);
  });

  it("should preserve new definition description when it differs from old config", () => {
    const newConfig: NotificationsConfig = {
      endpoints: [
        {
          name: "Test Endpoint Description",
          enabled: true,
          isBanner: false,
          correlationId: "Test Endpoint Description",
          priority: Priority.medium,
          url: "http://example.com",
          method: "GET",
          conditions: ["[BODY].value < 80"],
          interval: "30s",
          group: "host",
          alerts: [dummyAlert],
          definition: { title: "Test Title", description: "New Description" },
          metric: dummyMetric
        }
      ],
      customEndpoints: []
    };
    const oldConfig: NotificationsConfig = {
      endpoints: [
        {
          name: "Test Endpoint Description",
          enabled: false,
          isBanner: false,
          correlationId: "Test Endpoint Description",
          priority: Priority.medium,
          url: "http://example.com",
          method: "GET",
          conditions: ["[BODY].value < 80"],
          interval: "30s",
          group: "host",
          alerts: [dummyAlert],
          definition: { title: "Test Title", description: "Old Description" },
          metric: dummyMetric
        }
      ],
      customEndpoints: []
    };
    const result = merger.applyPreviousEndpoints("dnp", true, newConfig, oldConfig);
    expect(result.endpoints).to.have.lengthOf(1);
    expect(result.endpoints![0].definition.description).to.equal("New Description");
  });

  it("should persist updated custom endpoint description while keeping enabled and threshold", () => {
    const newConfig: NotificationsConfig = {
      endpoints: [],
      customEndpoints: [
        {
          name: "Custom Desc Change",
          correlationId: "Custom Desc Change",
          enabled: true,
          isBanner: true,
          description: "New Description",
          metric: { treshold: 55, min: 0, max: 100, unit: "%" }
        }
      ]
    };
    const oldConfig: NotificationsConfig = {
      endpoints: [],
      customEndpoints: [
        {
          name: "Custom Desc Change",
          correlationId: "Custom Desc Change",
          enabled: false,
          isBanner: false,
          description: "Old Description",
          metric: { treshold: 60, min: 0, max: 100, unit: "%" }
        }
      ]
    };
    const result = merger.applyPreviousEndpoints("dnp", true, newConfig, oldConfig);
    expect(result.customEndpoints).to.have.lengthOf(1);
    const merged = result.customEndpoints![0];
    // enabled and threshold preserved from old
    expect(merged.enabled).to.equal(false);
    expect(merged.metric?.treshold).to.equal(60);
    // description and isBanner updated from new
    expect(merged.description).to.equal("New Description");
    expect(merged.isBanner).to.equal(true);
  });

  it("should apply multiple new field changes on Gatus and Custom endpoints and preserve only enabled and threshold", () => {
    const newConfig: NotificationsConfig = {
      endpoints: [
        {
          name: "Multi Change",
          correlationId: "multi-change",
          enabled: true,
          isBanner: true,
          priority: Priority.high,
          url: "http://new-url.example.com",
          method: "POST",
          conditions: ["[BODY].value < 90"],
          interval: "45s",
          group: "new-group",
          alerts: [dummyAlert],
          definition: { title: "New Title", description: "New Desc" },
          metric: dummyMetric
        }
      ],
      customEndpoints: [
        {
          name: "Multi Change Custom",
          correlationId: "multi-change-custom",
          enabled: true,
          isBanner: true,
          description: "New Custom Desc",
          metric: { treshold: 75, min: 0, max: 100, unit: "%" }
        }
      ]
    };
    const oldConfig: NotificationsConfig = {
      endpoints: [
        {
          name: "Multi Change",
          correlationId: "multi-change",
          enabled: false,
          isBanner: false,
          priority: Priority.low,
          url: "http://old-url.example.com",
          method: "GET",
          conditions: ["[BODY].value < 50"],
          interval: "30s",
          group: "old-group",
          alerts: [dummyAlert],
          definition: { title: "Old Title", description: "Old Desc" },
          metric: dummyMetric
        }
      ],
      customEndpoints: [
        {
          name: "Multi Change Custom",
          correlationId: "multi-change-custom",
          enabled: false,
          isBanner: false,
          description: "Old Custom Desc",
          metric: { treshold: 65, min: 0, max: 100, unit: "%" }
        }
      ]
    };
    const result = merger.applyPreviousEndpoints("dnp", true, newConfig, oldConfig);
    // Gatus endpoint: only enabled and threshold from old
    const ge = result.endpoints![0];
    expect(ge.enabled).to.equal(false);
    expect(ge.conditions[0]).to.equal("[BODY].value < 50");
    // All other fields from new
    expect(ge.url).to.equal("http://new-url.example.com");
    expect(ge.method).to.equal("POST");
    expect(ge.priority).to.equal(Priority.high);
    expect(ge.isBanner).to.equal(true);
    expect(ge.definition.title).to.equal("New Title");

    // Custom endpoint: only enabled and threshold from old
    const ce = result.customEndpoints![0];
    expect(ce.enabled).to.equal(false);
    expect(ce.metric?.treshold).to.equal(65);
    // All other fields from new
    expect(ce.description).to.equal("New Custom Desc");
    expect(ce.isBanner).to.equal(true);
  });
});
