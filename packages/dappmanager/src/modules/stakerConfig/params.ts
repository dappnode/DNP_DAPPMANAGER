import { Network } from "@dappnode/types";
import { ExecutionClientOrSignerVersions } from "./types";

const lodestarStakersPraterMinimumVersions: ExecutionClientOrSignerVersions<"prater"> =
  {
    "goerli-nethermind.dnp.dappnode.eth": "1.0.8",
    "goerli-geth.dnp.dappnode.eth": "0.4.28",
    "goerli-erigon.dnp.dappnode.eth": "0.1.5",
    "goerli-besu.dnp.dappnode.eth": "0.1.1",
    "web3signer-prater.dnp.dappnode.eth": "0.1.18"
  };

const lodestarStakersGnosisMinimumVersions: ExecutionClientOrSignerVersions<"gnosis"> =
  {
    "nethermind-xdai.dnp.dappnode.eth": "1.0.29",
    "web3signer-gnosis.dnp.dappnode.eth": "1.0.1"
  };

const lodestarStakersMainnetMinimumVersions: ExecutionClientOrSignerVersions<"mainnet"> =
  {
    "nethermind.public.dappnode.eth": "1.0.35",
    "geth.dnp.dappnode.eth": "0.1.38",
    "erigon.dnp.dappnode.eth": "0.1.38",
    "besu.public.dappnode.eth": "1.2.7",
    "web3signer.dnp.dappnode.eth": "2.0.0"
  };

export function getLodestarStakersMinimumVersions<T extends Network>(
  network: T
): ExecutionClientOrSignerVersions<T> {
  switch (network) {
    case "prater":
      return lodestarStakersPraterMinimumVersions as ExecutionClientOrSignerVersions<T>;
    case "gnosis":
      return lodestarStakersGnosisMinimumVersions as ExecutionClientOrSignerVersions<T>;
    case "mainnet":
      return lodestarStakersMainnetMinimumVersions as ExecutionClientOrSignerVersions<T>;
    default:
      throw Error(`Network ${network} not supported`);
  }
}
