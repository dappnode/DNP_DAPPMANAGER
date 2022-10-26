import {
  ConsensusClient,
  ConsensusClientGnosis,
  ConsensusClientMainnet,
  ConsensusClientPrater,
  ExececutionClient,
  ExecutionClientGnosis,
  ExecutionClientMainnet,
  ExecutionClientPrater,
  Network
} from "../../types";

export interface StakerParamsByNetwork<T extends Network> {
  execClients: {
    dnpName: ExececutionClient<T>;
    minVersion: string;
  }[];
  currentExecClient: ExececutionClient<T>;
  consClients: {
    dnpName: ConsensusClient<T>;
    minVersion: string;
  }[];
  currentConsClient: ConsensusClient<T>;
  web3signer: {
    dnpName: string;
    minVersion: string;
  };
  mevBoostDnpName: string;
  isMevBoostSelected: boolean;
}
