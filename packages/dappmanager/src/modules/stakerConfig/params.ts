import { Network } from "@dappnode/common";
import {
  ExecutionClientOrSignerVersion,
  LodestarStakersMinimumVersions
} from "./types";

const lodestarStakersPraterMinimumVersions: ExecutionClientOrSignerVersion<"prater"> =
  {
    "goerli-nethermind.dnp.dappnode.eth": "1.0.8",
    "goerli-geth.dnp.dappnode.eth": "0.4.28",
    "goerli-erigon.dnp.dappnode.eth": "0.1.5",
    "goerli-besu.dnp.dappnode.eth": "0.1.1",
    "web3signer-prater.dnp.dappnode.eth": "0.1.18"
  };

const lodestarStakersGnosisMinimumVersions: ExecutionClientOrSignerVersion<"gnosis"> =
  {
    "nethermind-xdai.dnp.dappnode.eth": "1.0.29", // Needs publishment
    "web3signer-gnosis.dnp.dappnode.eth": "0.1.13" // Needs publishment
  };

const lodestarStakersMainnetMinimumVersions: ExecutionClientOrSignerVersion<"mainnet"> =
  {
    "nethermind.public.dappnode.eth": "1.0.35", // Not working
    "geth.dnp.dappnode.eth": "0.1.38", // Needs publishment
    "erigon.dnp.dappnode.eth": "0.1.38",
    "besu.public.dappnode.eth": "1.2.7", // Needs publishment
    "web3signer.dnp.dappnode.eth": "0.1.7" // Needs publishment
  };

export const lodestarStakersMinimumVersions: LodestarStakersMinimumVersions<Network> =
  {
    prater: lodestarStakersPraterMinimumVersions,
    gnosis: lodestarStakersGnosisMinimumVersions,
    mainnet: lodestarStakersMainnetMinimumVersions
  };
