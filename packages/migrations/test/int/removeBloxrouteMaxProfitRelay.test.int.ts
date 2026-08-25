import { expect } from "chai";
import { BLOXROUTE_MAX_PROFIT_RELAY, removeRelayFromList } from "../../src/removeBloxrouteMaxProfitRelay.js";

describe("removeBloxrouteMaxProfitRelay", () => {
  const flashbotsRelay = "https://flashbots.example";
  const regulatedRelay = "https://bloxroute-regulated.example";

  it("removes the Max Profit relay and preserves all other relays", () => {
    const relays = [flashbotsRelay, BLOXROUTE_MAX_PROFIT_RELAY, regulatedRelay].join(",");

    expect(removeRelayFromList(relays, BLOXROUTE_MAX_PROFIT_RELAY)).to.equal(
      [flashbotsRelay, regulatedRelay].join(",")
    );
  });

  it("removes every occurrence and is idempotent", () => {
    const relays = [BLOXROUTE_MAX_PROFIT_RELAY, flashbotsRelay, BLOXROUTE_MAX_PROFIT_RELAY].join(",");
    const migratedRelays = removeRelayFromList(relays, BLOXROUTE_MAX_PROFIT_RELAY);

    expect(migratedRelays).to.equal(flashbotsRelay);
    expect(removeRelayFromList(migratedRelays, BLOXROUTE_MAX_PROFIT_RELAY)).to.equal(flashbotsRelay);
  });

  it("does not rewrite relay lists that do not contain Max Profit", () => {
    const relays = ` ${flashbotsRelay}, ${regulatedRelay} `;

    expect(removeRelayFromList(relays, BLOXROUTE_MAX_PROFIT_RELAY)).to.equal(relays);
  });
});
