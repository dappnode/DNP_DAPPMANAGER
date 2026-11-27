import "mocha";
import { expect } from "chai";
import { ConsensusContext, evaluateExecution, ExecutionRaw } from "../../../src/nodeSyncStatus/execution.js";
import { parsePrometheus } from "../../../src/nodeSyncStatus/prometheus.js";
import { ProgressTracker } from "../../../src/nodeSyncStatus/progressTracker.js";

const nowMs = 1_800_000_000_000;
const now = nowMs / 1000;
const hex = (n: number) => `0x${n.toString(16)}`;

const ccAtHead: ConsensusContext = { reachable: true, atHead: true, executionTarget: 20_000_000 };
const ccSyncing: ConsensusContext = { reachable: true, atHead: false, executionTarget: null };
const ccUnreachable: ConsensusContext = { reachable: false, atHead: false, executionTarget: null };

function raw(overrides: Partial<ExecutionRaw>): ExecutionRaw {
  return {
    name: "Geth",
    kind: "geth",
    syncing: false,
    head: { number: 20_000_000, timestamp: now - 10 },
    peers: 40,
    metrics: null,
    healthIssues: [],
    ...overrides
  };
}

const evaluate = (r: ExecutionRaw, cc: ConsensusContext, tracker = new ProgressTracker(), at = nowMs) =>
  evaluateExecution(r, cc, 12, at, tracker, "ec");

describe("nodeSyncStatus > execution", () => {
  describe("synced", () => {
    it("is synced with a recent head close to the CC head", () => {
      expect(evaluate(raw({}), ccAtHead).state).to.equal("synced");
    });

    it("is synced with a recent head when the CC head is unknown", () => {
      expect(evaluate(raw({}), ccUnreachable).state).to.equal("synced");
    });

    it("counts Geth indexing transactions at the head as synced, with a background note", () => {
      const syncing = { currentBlock: hex(20_000_000), highestBlock: hex(20_000_000), txIndexRemainingBlocks: "0x10" };
      const result = evaluate(raw({ syncing }), ccAtHead);
      expect(result.state).to.equal("synced");
      expect(result.background).to.equal("Indexing transactions");
    });

    it("counts Nethermind downloading old receipts at the head as synced", () => {
      const syncing = { startingBlock: "0x0", currentBlock: hex(20_000_000), highestBlock: hex(20_000_001) };
      const result = evaluate(raw({ name: "Nethermind", kind: "nethermind", syncing }), ccAtHead);
      expect(result.state).to.equal("synced");
      expect(result.background).to.equal("Downloading old blocks and receipts");
    });
  });

  describe("eth_syncing false but not at the head", () => {
    it("catches up after downtime, measured against the CC head", () => {
      const result = evaluate(raw({ head: { number: 19_999_000, timestamp: now - 12_000 } }), ccAtHead);
      expect(result.state).to.equal("syncing");
      expect(result.phase).to.equal("Catching up");
      expect(result.behind).to.deep.equal({ count: 1000, unit: "blocks", seconds: 12_000 });
    });

    it("waits for the CC when it is unreachable and the head is stale", () => {
      const result = evaluate(raw({ head: { number: 0, timestamp: 1_438_269_973 } }), ccUnreachable);
      expect(result.state).to.equal("waiting");
      expect(result.phase).to.equal("Waiting for the consensus client");
    });

    it("waits for a CC that is still syncing", () => {
      const result = evaluate(raw({ head: { number: 19_000_000, timestamp: now - 9999 } }), ccSyncing);
      expect(result.state).to.equal("waiting");
      expect(result.phase).to.equal("Waiting for the consensus client to sync");
    });

    it("reads Besu snap sync phases from its sync duration timers", () => {
      const metrics = parsePrometheus(
        [
          'besu_synchronizer_sync_duration_count{name="CHAIN_DOWNLOAD_DURATION",} 1.0',
          'besu_synchronizer_sync_duration_count{name="SNAP_INITIAL_WORLD_STATE_DOWNLOAD_DURATION",} 1.0',
          'besu_synchronizer_sync_duration_count{name="SNAP_WORLD_STATE_HEALING_DURATION",} 0.0'
        ].join("\n")
      );
      const result = evaluate(
        raw({ name: "besu", kind: "besu", metrics, head: { number: 19_999_900, timestamp: now - 1200 } }),
        ccAtHead
      );
      expect(result.state).to.equal("syncing");
      expect(result.phase).to.equal("Healing state");
      expect(result.phaseProgress).to.equal(null);
    });
  });

  describe("Geth", () => {
    it("downloads headers when nothing is downloaded yet and the CC drives it", () => {
      const syncing = { currentBlock: "0x0", highestBlock: "0x0", txIndexRemainingBlocks: "0x1" };
      const result = evaluate(raw({ syncing, head: { number: 0, timestamp: 1_438_269_973 } }), ccAtHead);
      expect(result.phase).to.equal("Downloading block headers");
    });

    it("measures the state download from the snap progress metric", () => {
      const syncing = { currentBlock: hex(19_999_900), highestBlock: hex(20_000_000), syncedAccounts: "0x100" };
      const metrics = parsePrometheus("eth_protocols_snap_sync_progress 0.437\neth_downloader_chain_progress 0.99");
      const result = evaluate(raw({ syncing, metrics, head: { number: 0, timestamp: 1_438_269_973 } }), ccAtHead);
      expect(result.phase).to.equal("Downloading state");
      expect(result.phaseProgress).to.equal(43);
    });

    it("shows healing without a percentage", () => {
      const syncing = { currentBlock: hex(19_999_900), highestBlock: hex(20_000_000), healingTrienodes: "0x50" };
      const result = evaluate(raw({ syncing, head: { number: 0, timestamp: 1_438_269_973 } }), ccAtHead);
      expect(result.phase).to.equal("Healing state");
      expect(result.phaseProgress).to.equal(null);
    });
  });

  describe("Erigon", () => {
    const erigon = (syncing: Record<string, unknown>) =>
      raw({ name: "erigon", kind: "erigon", syncing, head: { number: 0, timestamp: 1_438_269_973 } });

    it("measures the snapshot download from current / highest", () => {
      const result = evaluate(
        erigon({ currentBlock: hex(5_000_000), highestBlock: hex(20_000_000), stages: [] }),
        ccAtHead
      );
      expect(result.phase).to.equal("Downloading snapshots");
      expect(result.phaseProgress).to.equal(25);
    });

    it("shows indexing once the download numbers reach the end", () => {
      const result = evaluate(
        erigon({ currentBlock: hex(19_999_999), highestBlock: hex(20_000_000), stages: [] }),
        ccAtHead
      );
      expect(result.phase).to.equal("Indexing snapshots");
    });

    it("counts blocks left while executing, ignoring startingBlock", () => {
      const syncing = {
        startingBlock: hex(19_900_000),
        currentBlock: hex(19_950_000),
        highestBlock: hex(20_000_000),
        stages: [{ stage_name: "Execution", block_number: hex(19_950_000) }]
      };
      const result = evaluate(erigon(syncing), ccAtHead);
      expect(result.phase).to.equal("Executing blocks");
      expect(result.behind?.count).to.equal(50_000);
    });
  });

  describe("Nethermind", () => {
    const nethermind = (syncing: Record<string, unknown>) =>
      raw({ name: "Nethermind", kind: "nethermind", syncing, head: { number: 0, timestamp: 1_438_269_973 } });

    it("measures the state download from warp chunks (2.3+)", () => {
      const syncing = {
        startingBlock: "0x0",
        currentBlock: "0x0",
        highestBlock: hex(20_000_000),
        warpChunksProcessed: 2500,
        warpChunksAmount: 10000
      };
      const result = evaluate(nethermind(syncing), ccAtHead);
      expect(result.phase).to.equal("Downloading state");
      expect(result.phaseProgress).to.equal(25);
    });

    it("waits for the CC before it has a target", () => {
      const result = evaluate(
        nethermind({ startingBlock: "0x0", currentBlock: "0x0", highestBlock: "0x0" }),
        ccUnreachable
      );
      expect(result.state).to.equal("waiting");
    });
  });

  describe("Reth", () => {
    const reth = (stages: [string, number][], current = 0) =>
      raw({
        name: "reth",
        kind: "reth",
        head: { number: current, timestamp: 1_438_269_973 },
        syncing: {
          startingBlock: "0x0",
          currentBlock: hex(current),
          highestBlock: hex(current),
          stages: stages.map(([name, block]) => ({ name, block: hex(block) }))
        }
      });

    it("weighs the pipeline stages and names the first unfinished one", () => {
      const result = evaluate(
        reth([
          ["Headers", 20_000_000],
          ["Bodies", 20_000_000],
          ["SenderRecovery", 20_000_000],
          ["Execution", 10_000_000],
          ["MerkleExecute", 0]
        ]),
        ccAtHead
      );
      expect(result.phase).to.equal("Executing blocks");
      // Of the 84 points of the stages present, 20 are done in full plus half of Execution's 60
      expect(result.phaseProgress).to.equal(Math.floor(((20 + 30) / 84) * 100));
    });

    it("waits for the CC when every stage is at the head and no CC drives it", () => {
      const result = evaluate(
        reth(
          [
            ["Headers", 15_000_000],
            ["Execution", 15_000_000]
          ],
          15_000_000
        ),
        ccUnreachable
      );
      expect(result.state).to.equal("waiting");
    });
  });

  it("is stalled with no peers", () => {
    const result = evaluate(raw({ peers: 0, head: { number: 19_000_000, timestamp: now - 9999 } }), ccAtHead);
    expect(result.state).to.equal("stalled");
    expect(result.issues).to.include("No peers");
  });

  it("is stalled when the head does not move for five minutes", () => {
    const tracker = new ProgressTracker();
    const behind = raw({ head: { number: 19_000_000, timestamp: now - 9999 } });
    evaluate(behind, ccAtHead, tracker, nowMs);
    const result = evaluate(behind, ccAtHead, tracker, nowMs + 6 * 60_000);
    expect(result.state).to.equal("stalled");
  });
});
