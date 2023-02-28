import { Network } from "@dappnode/common";
import {
  ExecutionClientOrSignerVersion,
  LodestarStakersMinimumVersions
} from "./types";

const lodestarStakersPraterMinimumVersions: ExecutionClientOrSignerVersion<"prater"> =
  {
    "goerli-nethermind.dnp.dappnode.eth": "1.0.8",
    "goerli-geth.dnp.dappnode.eth": "0.4.27",
    "goerli-erigon.dnp.dappnode.eth": "0.1.4",
    "goerli-besu.dnp.dappnode.eth": "0.1.1",
    "web3signer-prater.dnp.dappnode.eth": "0.1.17"
  };

const lodestarStakersGnosisMinimumVersions: ExecutionClientOrSignerVersion<"gnosis"> =
  {
    "nethermind-xdai.dnp.dappnode.eth": "1.0.25",
    "web3signer-gnosis.dnp.dappnode.eth": "0.1.12"
  };

const lodestarStakersMainnetMinimumVersions: ExecutionClientOrSignerVersion<"mainnet"> =
  {
    "nethermind.public.dappnode.eth": "1.0.32",
    "geth.dnp.dappnode.eth": "0.1.37",
    "erigon.dnp.dappnode.eth": "0.1.37",
    "besu.public.dappnode.eth": "1.2.7",
    "web3signer.dnp.dappnode.eth": "0.1.6"
  };

export const lodestarStakersMinimumVersions: LodestarStakersMinimumVersions<Network> =
  {
    prater: lodestarStakersPraterMinimumVersions,
    gnosis: lodestarStakersGnosisMinimumVersions,
    mainnet: lodestarStakersMainnetMinimumVersions
  };
