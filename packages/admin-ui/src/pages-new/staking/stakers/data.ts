import { Network } from "@dappnode/types";

/* ── Network definitions ────────────────────────────────────────────── */

export interface NetworkDef {
  /** URL-friendly slug used in the route */
  slug: string;
  /** Human-readable label */
  label: string;
  /** Network enum value */
  network: Network;
  /** Short description shown in the accordion */
  description: string;
  /** "mainnet" | "testnet" for the toggle filter */
  group: "mainnet" | "testnet";
  /** Network type for deciding which columns to show */
  type: "staker" | "starknet" | "optimism";
}

export const networkDefs: NetworkDef[] = [
  {
    slug: "ethereum",
    label: "Ethereum",
    network: Network.Mainnet,
    group: "mainnet",
    type: "staker",
    description:
      "Ethereum is a decentralized, permissionless blockchain platform that employs a proof-of-stake (PoS) consensus mechanism, where validators stake Ether (ETH) to secure the network and validate transactions in exchange for ETH rewards."
  },
  {
    slug: "gnosis",
    label: "Gnosis",
    network: Network.Gnosis,
    group: "mainnet",
    type: "staker",
    description:
      "The Gnosis Chain Network is a highly efficient, Ethereum-compatible blockchain that emphasizes security, low transaction costs, and fast execution speeds, catering primarily to decentralized finance (DeFi) applications and prediction markets."
  },
  {
    slug: "lukso",
    label: "Lukso",
    network: Network.Lukso,
    group: "mainnet",
    type: "staker",
    description:
      "The LUKSO Blockchain is a next-gen, Ethereum-based platform designed specifically for the fashion, gaming, design, and social media industries, focusing on creating a new digital lifestyle space."
  },
  {
    slug: "hoodi",
    label: "Hoodi",
    network: Network.Hoodi,
    group: "testnet",
    type: "staker",
    description:
      "Hoodi is the latest public Ethereum testnet introduced to support the Pectra upgrade. It focuses on testing Ethereum Improvement Proposals (EIPs), staking mechanisms, and wallet interactions in a post-merge environment."
  },
  {
    slug: "sepolia",
    label: "Sepolia",
    network: Network.Sepolia,
    group: "testnet",
    type: "staker",
    description:
      "Sepolia is a public Ethereum testnet designed for developers who want to test their applications in a pre-production environment. While not a network for testing staking, it is still a valuable resource for developers."
  },
  {
    slug: "starknet",
    label: "Starknet",
    network: Network.StarknetMainnet,
    group: "mainnet",
    type: "starknet",
    description:
      "Starknet is a permissionless decentralized Layer 2 validity rollup (ZK-Rollup) that operates as a scaling solution for Ethereum, leveraging STARK cryptographic proofs."
  },
  {
    slug: "starknet-sepolia",
    label: "Starknet Sepolia",
    network: Network.StarknetSepolia,
    group: "testnet",
    type: "starknet",
    description:
      "Starknet Sepolia is the public testnet for Starknet, providing developers with a pre-production environment to test their applications."
  },
  {
    slug: "optimism",
    label: "Optimism",
    network: Network.Mainnet, // Optimism uses mainnet as L1
    group: "mainnet",
    type: "optimism",
    description:
      "Optimism is a Layer 2 solution for Ethereum. Rather than operating as an independent EVM chain, Optimism executes transactions off-chain and posts compressed data to Ethereum."
  }
];

/* ── Relay definitions ──────────────────────────────────────────────── */

export interface RelayDef {
  operator: string;
  url: string;
  docs?: string;
  ofacCompliant?: boolean;
}

export function getDefaultRelays(network: Network): RelayDef[] {
  switch (network) {
    case "mainnet":
      return [
        {
          operator: "Agnostic Boost",
          ofacCompliant: false,
          docs: "https://agnostic-relay.net/",
          url: "https://0xa7ab7a996c8584251c8f925da3170bdfd6ebc75d50f5ddc4050a6fdc77f2a3b5fce2cc750d0865e05d7228af97d69561@agnostic-relay.net"
        },
        {
          operator: "Ultra Sound",
          ofacCompliant: false,
          docs: "https://relay.ultrasound.money/",
          url: "https://0xa1559ace749633b997cb3fdacffb890aeebdb0f5a3b6aaa7eeeaf1a38af0a8fe88b9e4b1f61f236d2e64d95733327a62@relay.ultrasound.money"
        },
        {
          operator: "Ultra Sound (filtered)",
          ofacCompliant: true,
          docs: "https://relay.ultrasound.money/",
          url: "https://0xa1559ace749633b997cb3fdacffb890aeebdb0f5a3b6aaa7eeeaf1a38af0a8fe88b9e4b1f61f236d2e64d95733327a62@relay-filtered.ultrasound.money"
        },
        {
          operator: "Flashbots",
          ofacCompliant: true,
          docs: "https://boost.flashbots.net/",
          url: "https://0xac6e77dfe25ecd6110b8e780608cce0dab71fdd5ebea22a16c0205200f2f8e2e3ad3b71d3499c54ad14d6c21b41a37ae@boost-relay.flashbots.net"
        },
        {
          operator: "bloXroute (Max profit)",
          ofacCompliant: true,
          docs: "https://bloxroute.com/",
          url: "https://0x8b5d2e73e2a3a55c6c87b8b6eb92e0149a125c852751db1422fa951e42a09b82c142c3ea98d0d9930b056a3bc9896b8f@bloxroute.max-profit.blxrbdn.com"
        },
        {
          operator: "bloXroute (Regulated)",
          ofacCompliant: true,
          docs: "https://bloxroute.com/",
          url: "https://0xb0b07cd0abef743db4260b0ed50619cf6ad4d82064cb4fbec9d3ec530f7c5e6793d9f286c4e082c0244ffb9f2658fe88@bloxroute.regulated.blxrbdn.com"
        },
        {
          operator: "Titan (Non-Filtered)",
          ofacCompliant: false,
          docs: "https://docs.titanrelay.xyz/",
          url: "https://0x8c4ed5e24fe5c6ae21018437bde147693f68cda427cd1122cf20819c30eda7ed74f72dece09bb313f2a1855595ab677d@global.titanrelay.xyz"
        },
        {
          operator: "Titan (Filtered)",
          ofacCompliant: true,
          docs: "https://docs.titanrelay.xyz/",
          url: "https://0x8c4ed5e24fe5c6ae21018437bde147693f68cda427cd1122cf20819c30eda7ed74f72dece09bb313f2a1855595ab677d@regional.titanrelay.xyz"
        },
        {
          operator: "Aestus",
          ofacCompliant: false,
          docs: "https://aestus.live/",
          url: "https://0xa15b52576bcbf1072f4a011c0f99f9fb6c66f3e1ff321f11f461d15e31b1cb359caa092c71bbded0bae5b5ea401aab7e@aestus.live"
        }
      ];
    case "holesky":
      return [
        {
          operator: "Flashbots",
          docs: "https://www.flashbots.net/",
          url: "https://0xafa4c6985aa049fb79dd37010438cfebeb0f2bd42b115b89dd678dab0670c1de38da0c4e9138c9290a398ecd9a0b3110@boost-relay-holesky.flashbots.net"
        },
        {
          operator: "Aestus",
          docs: "https://flashbots.notion.site/Relay-API-Documentation-5fb0819366954962bc02e81cb33840f5#417abe417dde45caaff3dc15aaae65dd",
          url: "https://0xab78bf8c781c58078c3beb5710c57940874dd96aef2835e7742c866b4c7c0406754376c2c8285a36c630346aa5c5f833@holesky.aestus.live"
        },
        {
          operator: "Ultrasound",
          docs: "https://github.com/ultrasoundmoney/frontend",
          url: "https://0xb1559beef7b5ba3127485bbbb090362d9f497ba64e177ee2c8e7db74746306efad687f2cf8574e38d70067d40ef136dc@relay-stag.ultrasound.money"
        },
        {
          operator: "Titan",
          docs: "https://docs.titanrelay.xyz/",
          url: "https://0xaa58208899c6105603b74396734a6263cc7d947f444f396a90f7b7d3e65d102aec7e5e5291b27e08d02c50a050825c2f@holesky.titanrelay.xyz"
        },
        {
          operator: "bloXroute",
          docs: "https://bloxroute.holesky.blxrbdn.com/",
          url: "https://0x821f2a65afb70e7f2e820a925a9b4c80a159620582c1766b1b09729fec178b11ea22abb3a51f07b288be815a1a2ff516@bloxroute.holesky.blxrbdn.com"
        }
      ];
    case "hoodi":
      return [
        {
          operator: "Flashbots",
          docs: "https://www.flashbots.net/",
          url: "https://0xafa4c6985aa049fb79dd37010438cfebeb0f2bd42b115b89dd678dab0670c1de38da0c4e9138c9290a398ecd9a0b3110@boost-relay-hoodi.flashbots.net"
        },
        {
          operator: "bloXroute",
          docs: "https://bloxroute.holesky.blxrbdn.com/",
          url: "https://0x821f2a65afb70e7f2e820a925a9b4c80a159620582c1766b1b09729fec178b11ea22abb3a51f07b288be815a1a2ff516@bloxroute.hoodi.blxrbdn.com"
        },
        {
          operator: "Titan",
          docs: "https://docs.titanrelay.xyz/",
          url: "https://0xaa58208899c6105603b74396734a6263cc7d947f444f396a90f7b7d3e65d102aec7e5e5291b27e08d02c50a050825c2f@hoodi.titanrelay.xyz"
        },
        {
          operator: "Aestus",
          docs: "https://flashbots.notion.site/Relay-API-Documentation-5fb0819366954962bc02e81cb33840f5#417abe417dde45caaff3dc15aaae65dd",
          url: "https://0x98f0ef62f00780cf8eb06701a7d22725b9437d4768bb19b363e882ae87129945ec206ec2dc16933f31d983f8225772b6@hoodi.aestus.live"
        }
      ];
    case "prater":
      return [
        {
          operator: "Flashbots",
          docs: "https://www.flashbots.net/",
          url: "https://0xafa4c6985aa049fb79dd37010438cfebeb0f2bd42b115b89dd678dab0670c1de38da0c4e9138c9290a398ecd9a0b3110@builder-relay-goerli.flashbots.net"
        },
        {
          operator: "bloXroute",
          docs: "https://bloxroute.com/",
          url: "https://0x821f2a65afb70e7f2e820a925a9b4c80a159620582c1766b1b09729fec178b11ea22abb3a51f07b288be815a1a2ff516@bloxroute.max-profit.builder.goerli.blxrbdn.com"
        }
      ];
    default:
      return [];
  }
}

/** Networks that support MEV boost relays */
export const mevBoostNetworks: Network[] = [
  Network.Mainnet,
  Network.Prater,
  Network.Holesky,
  Network.Hoodi
];

/** Networks that show the Smooth promo banner */
export const smoothNetworks: Network[] = [Network.Hoodi, Network.Mainnet];

/** Networks where Sepolia staking note is shown */
export const sepoliaStakingNote = Network.Sepolia;
