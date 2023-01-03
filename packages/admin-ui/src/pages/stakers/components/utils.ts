import {
  Network,
  StakerConfigSet,
  StakerItem,
  StakerItemOk,
  StakerType
} from "@dappnode/common";
import { isEqual, pick } from "lodash-es";

export function subStringifyConfig(config: string): string {
  return config.length > 35
    ? `${config.substring(0, 10)}...${config.substring(
        config.length - 10,
        config.length
      )}`
    : config;
}

export function validateEthereumAddress(value?: string): string | null {
  if (value && !/^0x[0-9a-fA-F]{40}$/.test(value)) return "Invalid address";
  return null;
}

export function validateGraffiti(value?: string): string | null {
  // It must be not more than 32 characters long
  if (value && value.length > 32)
    return "Graffiti must be less than 32 characters";
  return null;
}

export function isOkSelectedInstalledAndRunning<
  T extends Network,
  P extends StakerType
>(StakerItem: StakerItem<T, P>): boolean {
  return (
    StakerItem.status === "ok" &&
    StakerItem.isSelected &&
    StakerItem.isInstalled &&
    StakerItem.isRunning
  );
}

/**
 * Returns if the changes are allowed to be set:
 * - At leaset EC and CC must be selected or none of them
 * - Any change in:
 *   - graffiti
 *   - fee recipient
 *   - checkpoint sync
 *   - CC/EC
 *   - Signer
 *   - MEV boost
 *   - MEV boost relays
 */
export function getChanges<T extends Network>({
  currentStakerConfig,
  feeRecipientError,
  graffitiError,
  newConsClient,
  newMevBoost,
  newEnableWeb3signer,
  newExecClient
}: {
  currentStakerConfig: StakerConfigSet<T>;
  feeRecipientError: string | null;
  graffitiError: string | null;
  newExecClient: StakerItemOk<T, "execution"> | undefined;
  newConsClient?: StakerItemOk<T, "consensus">;
  newMevBoost?: StakerItemOk<T, "mev-boost">;
  newEnableWeb3signer: boolean;
}): {
  isAllowed: boolean;
  reason?: string;
  severity?: "warning" | "secondary" | "danger";
} {
  // Not allowed if feerecipient or graffiti are invalid
  if (feeRecipientError || graffitiError)
    return {
      isAllowed: false,
      reason: "Invalid graffiti and/or fee recipient",
      severity: "danger"
    };

  const {
    executionClient,
    consensusClient,
    mevBoost,
    enableWeb3signer
  } = currentStakerConfig;
  const isExecAndConsSelected = Boolean(newExecClient && newConsClient);
  const isExecAndConsDeSelected = Boolean(!newExecClient && !newConsClient);
  const isConsClientEqual = isEqual(
    pick(consensusClient, [
      "checkpointSync",
      "dnpName",
      "feeRecipient",
      "graffiti"
    ]),
    pick(newConsClient, [
      "checkpointSync",
      "dnpName",
      "feeRecipient",
      "graffiti"
    ])
  );
  const isMevBoostEqual = isEqual(
    pick(mevBoost, ["dnpName", "relays"]),
    pick(newMevBoost, ["dnpName", "relays"])
  );

  // Not allowed if no changes
  if (
    !(
      executionClient !== newExecClient ||
      !isConsClientEqual ||
      !isMevBoostEqual ||
      enableWeb3signer !== newEnableWeb3signer
    )
  )
    return {
      isAllowed: false,
      reason: "No changes detected",
      severity: "secondary"
    };

  // Not allowed if changes AND (EC AND CC are deselected) AND (changes in signer or MEV boost)
  if (isExecAndConsDeSelected && (newEnableWeb3signer || newMevBoost))
    return {
      isAllowed: false,
      reason:
        "MEV Boost and/or Web3Signer selected but no consensus and execution client selected",
      severity: "warning"
    };

  // Not allowed if changes AND (EC or CC are deselected) AND (signer or mev boost)
  if (!isExecAndConsSelected && (newEnableWeb3signer || newMevBoost))
    return {
      isAllowed: false,
      reason:
        "To enable web3signer and/or MEV boost, execution and consensus clients must be selected",
      severity: "warning"
    };

  // Not allowed if changes AND (EC or CC are deselected) AND (no signer or no mev boost)
  if (newMevBoost && newMevBoost.relays?.length === 0)
    return {
      isAllowed: false,
      reason: "You must select at least one relay in the MEV boost",
      severity: "warning"
    };

  return { isAllowed: true };
}

export interface RelayIface {
  operator: string;
  url: string;
  docs?: string;
  ofacCompliant?: boolean;
}

export function mapRelays<T extends Network>(
  network: T,
  relaysUrl: string[]
): { operator: string; url: string; ofacCompliant?: boolean }[] {
  const defaultRelays = getDefaultRelays(network);

  return relaysUrl.map(relayUrl => {
    const defaultRelay = defaultRelays?.find(
      defaultRelay => defaultRelay.url === relayUrl
    );

    return {
      operator: defaultRelay?.operator || "Unknown",
      url: relayUrl,
      ofacCompliant: defaultRelay?.ofacCompliant || false
    };
  });
}

export const getDefaultRelays = <T extends Network>(
  network: T
): RelayIface[] => {
  switch (network) {
    case "mainnet":
      return [
        {
          operator: "Agnostic Boost",
          ofacCompliant: false,
          docs: "https://agnostic-relay.net/",
          url:
            "https://0xa7ab7a996c8584251c8f925da3170bdfd6ebc75d50f5ddc4050a6fdc77f2a3b5fce2cc750d0865e05d7228af97d69561@agnostic-relay.net"
        },
        {
          operator: "Ultra Sound",
          ofacCompliant: false,
          docs: "https://relay.ultrasound.money/",
          url:
            "https://0xa1559ace749633b997cb3fdacffb890aeebdb0f5a3b6aaa7eeeaf1a38af0a8fe88b9e4b1f61f236d2e64d95733327a62@relay.ultrasound.money"
        },
        {
          operator: "Flashbots",
          ofacCompliant: true,
          docs: "https://boost.flashbots.net/",
          url:
            "https://0xac6e77dfe25ecd6110b8e780608cce0dab71fdd5ebea22a16c0205200f2f8e2e3ad3b71d3499c54ad14d6c21b41a37ae@boost-relay.flashbots.net"
        },
        {
          operator: "bloXroute (Max profit)",
          ofacCompliant: false,
          docs: "https://bloxroute.com/",
          url:
            "https://0x8b5d2e73e2a3a55c6c87b8b6eb92e0149a125c852751db1422fa951e42a09b82c142c3ea98d0d9930b056a3bc9896b8f@bloxroute.max-profit.blxrbdn.com"
        },
        {
          operator: "bloXroute (Ethical)",
          ofacCompliant: false,
          docs: "https://bloxroute.com/",
          url:
            "https://0xad0a8bb54565c2211cee576363f3a347089d2f07cf72679d16911d740262694cadb62d7fd7483f27afd714ca0f1b9118@bloxroute.ethical.blxrbdn.com"
        },
        {
          operator: "bloXroute (Regulated)",
          ofacCompliant: true,
          docs: "https://bloxroute.com/",
          url:
            "https://0xb0b07cd0abef743db4260b0ed50619cf6ad4d82064cb4fbec9d3ec530f7c5e6793d9f286c4e082c0244ffb9f2658fe88@bloxroute.regulated.blxrbdn.com"
        },
        {
          operator: "Blocknative",
          ofacCompliant: true,
          docs: "https://www.blocknative.com/",
          url:
            "https://0x9000009807ed12c1f08bf4e81c6da3ba8e3fc3d953898ce0102433094e5f22f21102ec057841fcb81978ed1ea0fa8246@builder-relay-mainnet.blocknative.com"
        },
        {
          operator: "Eden Network",
          ofacCompliant: true,
          docs: "https://docs.edennetwork.io/",
          url:
            "https://0xb3ee7afcf27f1f1259ac1787876318c6584ee353097a50ed84f51a1f21a323b3736f271a895c7ce918c038e4265918be@relay.edennetwork.io"
        },
        {
          operator: "Anonymous",
          ofacCompliant: false,
          url:
            "https://0x84e78cb2ad883861c9eeeb7d1b22a8e02332637448f84144e245d20dff1eb97d7abdde96d4e7f80934e5554e11915c56@relayooor.wtf"
        }
      ];
    case "prater":
      return [
        {
          operator: "Flashbots",
          docs: "https://www.flashbots.net/",
          url:
            "https://0xafa4c6985aa049fb79dd37010438cfebeb0f2bd42b115b89dd678dab0670c1de38da0c4e9138c9290a398ecd9a0b3110@builder-relay-goerli.flashbots.net"
        },
        {
          operator: "bloXroute",
          docs: "https://bloxroute.com/",
          url:
            "https://0x821f2a65afb70e7f2e820a925a9b4c80a159620582c1766b1b09729fec178b11ea22abb3a51f07b288be815a1a2ff516@bloxroute.max-profit.builder.goerli.blxrbdn.com"
        },
        {
          operator: "Blocknative",
          docs: "https://www.blocknative.com/",
          url:
            "https://0x8f7b17a74569b7a57e9bdafd2e159380759f5dc3ccbd4bf600414147e8c4e1dc6ebada83c0139ac15850eb6c975e82d0@builder-relay-goerli.blocknative.com"
        },
        {
          operator: "Eden Network",
          docs: "https://docs.edennetwork.io/",
          url:
            "https://0xb1d229d9c21298a87846c7022ebeef277dfc321fe674fa45312e20b5b6c400bfde9383f801848d7837ed5fc449083a12@relay-goerli.edennetwork.io"
        },
        {
          operator: "Manifold",
          docs: "https://securerpc.com/",
          url:
            "https://0x8a72a5ec3e2909fff931c8b42c9e0e6c6e660ac48a98016777fc63a73316b3ffb5c622495106277f8dbcc17a06e92ca3@goerli-relay.securerpc.com/"
        }
      ];
    default:
      return [];
  }
};
