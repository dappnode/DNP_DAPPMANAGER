import "mocha";
import { expect } from "chai";
import {
  applyBesuSnapSyncState,
  parseBesuSnapSyncState,
  syncStatusFromEthSyncing,
  syncStatusFromHead
} from "../../../src/calls/nodeStatusGet.js";

const hex = (n: number) => `0x${n.toString(16)}`;
const now = 1_800_000_000;

describe("calls > nodeStatusGet", () => {
  describe("syncStatusFromEthSyncing", () => {
    it("computes progress from the eth_syncing range", () => {
      const syncing = { startingBlock: hex(0), currentBlock: hex(500), highestBlock: hex(1000) };
      expect(syncStatusFromEthSyncing(syncing, null)).to.deep.equal({
        isSynced: false,
        currentBlock: 500,
        progress: 50
      });
    });

    it("measures progress against the CC head when eth_syncing has no usable range", () => {
      const syncing = { startingBlock: hex(0), currentBlock: hex(250), highestBlock: hex(0) };
      expect(syncStatusFromEthSyncing(syncing, 1000).progress).to.equal(25);
    });

    it("reports 0 progress when neither eth_syncing nor the CC gives a target", () => {
      const syncing = { startingBlock: hex(0), currentBlock: hex(250), highestBlock: hex(0) };
      expect(syncStatusFromEthSyncing(syncing, null).progress).to.equal(0);
    });
  });

  describe("syncStatusFromHead", () => {
    it("is synced when the head is recent and matches the CC head", () => {
      const head = { number: 1000, timestamp: now - 12 };
      expect(syncStatusFromHead(head, 1001, now)).to.deep.equal({ isSynced: true, currentBlock: 1000, progress: 100 });
    });

    it("is synced when the CC head is unknown but the head is recent", () => {
      const head = { number: 1000, timestamp: now - 12 };
      expect(syncStatusFromHead(head, null, now).isSynced).to.equal(true);
    });

    it("is behind when the head trails the CC head, with progress towards it", () => {
      const head = { number: 500, timestamp: now - 12 };
      expect(syncStatusFromHead(head, 1000, now)).to.deep.equal({ isSynced: false, currentBlock: 500, progress: 50 });
    });

    it("is behind when the head is old, even if the CC head is unknown", () => {
      const head = { number: 0, timestamp: 1_438_269_973 };
      expect(syncStatusFromHead(head, null, now)).to.deep.equal({ isSynced: false, currentBlock: 0, progress: 0 });
    });

    it("never reports 100% progress while behind", () => {
      const head = { number: 999_900, timestamp: now - 3600 };
      expect(syncStatusFromHead(head, 1_000_000, now).progress).to.equal(99);
    });
  });

  describe("Besu snap sync", () => {
    const synced = { isSynced: true, currentBlock: 1000, progress: 100 };
    const metrics = (pivot: number, worldStateCount: number) =>
      [
        "# TYPE besu_synchronizer_fast_sync_pivot_block_current gauge",
        `besu_synchronizer_fast_sync_pivot_block_current ${pivot}.0`,
        `besu_synchronizer_sync_duration_count{name="SNAP_INITIAL_WORLD_STATE_DOWNLOAD_DURATION"} ${worldStateCount}.0`
      ].join("\n");

    it("parses the pivot block and world state download from the metrics", () => {
      expect(parseBesuSnapSyncState(metrics(1000, 0))).to.deep.equal({
        pivotBlock: 1000,
        isWorldStateDownloaded: false
      });
      expect(parseBesuSnapSyncState(metrics(1000, 1))).to.deep.equal({
        pivotBlock: 1000,
        isWorldStateDownloaded: true
      });
    });

    it("returns null when the metrics are missing", () => {
      expect(parseBesuSnapSyncState("besu_blockchain_height 1000")).to.equal(null);
    });

    it("marks a synced status as behind while the world state downloads", () => {
      const snap = { pivotBlock: 1010, isWorldStateDownloaded: false };
      expect(applyBesuSnapSyncState(synced, snap, 1020)).to.deep.equal({
        isSynced: false,
        currentBlock: 1000,
        progress: 98
      });
    });

    it("keeps a synced status once the world state is downloaded", () => {
      const snap = { pivotBlock: 900, isWorldStateDownloaded: true };
      expect(applyBesuSnapSyncState(synced, snap, 1000)).to.equal(synced);
    });

    it("keeps the status when the metrics are unavailable or snap sync never ran", () => {
      expect(applyBesuSnapSyncState(synced, null, 1000)).to.equal(synced);
      expect(applyBesuSnapSyncState(synced, { pivotBlock: 0, isWorldStateDownloaded: false }, 1000)).to.equal(synced);
    });
  });
});
