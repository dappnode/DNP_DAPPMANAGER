import "mocha";
import { expect } from "chai";
import { findMetric, parsePrometheus } from "../../../src/nodeSyncStatus/prometheus.js";
import { ProgressTracker } from "../../../src/nodeSyncStatus/progressTracker.js";

describe("nodeSyncStatus > prometheus", () => {
  const text = [
    "# HELP besu_synchronizer_sync_duration Time taken to sync",
    "# TYPE besu_synchronizer_sync_duration summary",
    'besu_synchronizer_sync_duration_count{name="FLAT_DB_HEAL",} 0.0',
    'besu_synchronizer_sync_duration_count{name="CHAIN_DOWNLOAD_DURATION"} 1.0',
    "besu_synchronizer_fast_sync_pivot_block_current 2.4E7",
    "geth_value NaN",
    ""
  ].join("\n");

  it("reads values, with or without a trailing comma after the labels", () => {
    const samples = parsePrometheus(text);
    expect(findMetric(samples, "besu_synchronizer_sync_duration_count", { name: "FLAT_DB_HEAL" })).to.equal(0);
    expect(findMetric(samples, "besu_synchronizer_sync_duration_count", { name: "CHAIN_DOWNLOAD_DURATION" })).to.equal(
      1
    );
    expect(findMetric(samples, "besu_synchronizer_fast_sync_pivot_block_current")).to.equal(24_000_000);
  });

  it("skips values that are not numbers and returns null for missing metrics", () => {
    const samples = parsePrometheus(text);
    expect(findMetric(samples, "geth_value")).to.equal(null);
    expect(findMetric(samples, "besu_synchronizer_sync_duration_count", { name: "TOTAL_SYNC_DURATION" })).to.equal(
      null
    );
    expect(findMetric(null, "anything")).to.equal(null);
  });
});

describe("nodeSyncStatus > progressTracker", () => {
  it("keeps the first value of a phase as the baseline and measures the rate after a minute", () => {
    const tracker = new ProgressTracker();
    expect(tracker.observe("k", "phase", 100, 0)).to.deep.equal({
      baseline: 100,
      ratePerSecond: null,
      isStalled: false
    });
    const observation = tracker.observe("k", "phase", 160, 60_000);
    expect(observation.baseline).to.equal(100);
    expect(observation.ratePerSecond).to.equal(1);
  });

  it("starts over when the phase changes", () => {
    const tracker = new ProgressTracker();
    tracker.observe("k", "one", 100, 0);
    expect(tracker.observe("k", "two", 5, 60_000).baseline).to.equal(5);
  });

  it("reports a stall only after five minutes without movement", () => {
    const tracker = new ProgressTracker();
    tracker.observe("k", "phase", 100, 0);
    expect(tracker.observe("k", "phase", 100, 4 * 60_000).isStalled).to.equal(false);
    expect(tracker.observe("k", "phase", 100, 5 * 60_000).isStalled).to.equal(true);
  });
});
