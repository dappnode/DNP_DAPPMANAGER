import "mocha";
import { expect } from "chai";
import { ConsensusRaw, evaluateConsensus } from "../../../src/nodeSyncStatus/consensus.js";
import { ProgressTracker } from "../../../src/nodeSyncStatus/progressTracker.js";

const genesisTime = 1_600_000_000;
const secondsPerSlot = 12;
const wallSlot = 1_000_000;
const nowMs = (genesisTime + wallSlot * secondsPerSlot) * 1000;

function raw(syncing: Partial<ConsensusRaw["syncing"]>, overrides: Partial<ConsensusRaw> = {}): ConsensusRaw {
  return {
    name: "Teku",
    syncing: {
      is_syncing: false,
      head_slot: String(wallSlot),
      sync_distance: "0",
      is_optimistic: false,
      el_offline: false,
      ...syncing
    },
    peers: 50,
    clock: { genesisTime, secondsPerSlot },
    headExecutionBlock: 20_000_000,
    ...overrides
  };
}

describe("nodeSyncStatus > consensus", () => {
  it("is synced at the head, validated and with its EC online, and gives the EC target", () => {
    const result = evaluateConsensus(raw({}), nowMs, new ProgressTracker(), "cc");
    expect(result.data.state).to.equal("synced");
    expect(result.atHead).to.equal(true);
    expect(result.executionTarget).to.equal(20_000_000);
  });

  it("waits for the EC while optimistic, still giving the EC target", () => {
    const result = evaluateConsensus(raw({ is_optimistic: true }), nowMs, new ProgressTracker(), "cc");
    expect(result.data.state).to.equal("waiting");
    expect(result.data.phase).to.equal("Waiting for the execution client to sync");
    expect(result.executionTarget).to.equal(20_000_000);
  });

  it("flags an offline EC", () => {
    const result = evaluateConsensus(raw({ el_offline: true }), nowMs, new ProgressTracker(), "cc");
    expect(result.data.state).to.equal("waiting");
    expect(result.data.issues).to.include("Execution client offline");
  });

  it("is not synced when is_syncing is false but the head is far behind the wall clock (Teku start-up, Nimbus stall)", () => {
    const result = evaluateConsensus(raw({ head_slot: String(wallSlot - 500) }), nowMs, new ProgressTracker(), "cc");
    expect(result.data.state).to.equal("syncing");
    expect(result.data.behind).to.deep.equal({ count: 500, unit: "slots", seconds: 6000 });
    expect(result.executionTarget).to.equal(null);
  });

  it("is synced within the slot tolerance even if is_syncing flickers", () => {
    const result = evaluateConsensus(
      raw({ is_syncing: true, head_slot: String(wallSlot - 1), sync_distance: "1" }),
      nowMs,
      new ProgressTracker(),
      "cc"
    );
    expect(result.data.state).to.equal("synced");
  });

  it("is stalled with no peers", () => {
    const result = evaluateConsensus(
      raw({ is_syncing: true, head_slot: String(wallSlot - 500) }, { peers: 0 }),
      nowMs,
      new ProgressTracker(),
      "cc"
    );
    expect(result.data.state).to.equal("stalled");
    expect(result.data.issues).to.include("No peers");
  });

  it("measures progress from the head first seen, and estimates the time left", () => {
    const tracker = new ProgressTracker();
    const start = wallSlot - 1000;
    evaluateConsensus(raw({ is_syncing: true, head_slot: String(start) }), nowMs, tracker, "cc");
    // Two minutes later: 10 more wall slots, 510 slots synced
    const later = nowMs + 120_000;
    const result = evaluateConsensus(raw({ is_syncing: true, head_slot: String(start + 510) }), later, tracker, "cc");
    expect(result.data.phaseProgress).to.equal(50);
    expect(result.data.etaSeconds).to.be.a("number").and.to.be.greaterThan(0);
  });

  it("falls back to sync_distance when the clock is unknown", () => {
    const result = evaluateConsensus(
      raw({ is_syncing: true, head_slot: "100", sync_distance: "40" }, { clock: null }),
      nowMs,
      new ProgressTracker(),
      "cc"
    );
    expect(result.data.state).to.equal("syncing");
    expect(result.data.behind).to.deep.equal({ count: 40, unit: "slots" });
    expect(result.data.phaseProgress).to.equal(null);
  });
});
