import {
  InstalledPackageData,
  ExecutionClient,
  StakerItemOk,
  ConsensusClient,
  Signer,
  Network,
} from "@dappnode/types";
import { lt } from "semver";

export function ensureSetRequirements<T extends Network>({
  network,
  executionClient,
  consensusClient,
  compatibleExecution,
  compatibleConsensus,
  compatibleSigner,
  currentExecClientPkg,
  currentConsClientPkg,
  currentWeb3signerPkg,
}: {
  network: Network;
  executionClient: StakerItemOk<T, "execution"> | undefined;
  consensusClient: StakerItemOk<T, "consensus"> | undefined;
  compatibleExecution: {
    dnpName: ExecutionClient<T>;
    minVersion: string;
  }[];
  compatibleConsensus: {
    dnpName: ConsensusClient<T>;
    minVersion: string;
  }[];
  compatibleSigner: {
    dnpName: Signer<T>;
    minVersion: string;
  };
  currentExecClientPkg?: InstalledPackageData;
  currentConsClientPkg?: InstalledPackageData;
  currentWeb3signerPkg?: InstalledPackageData;
}): void {
  // Ensure Execution clients DNP's names are valid
  if (
    executionClient &&
    !compatibleExecution
      .map((exCl) => exCl.dnpName)
      .includes(executionClient.dnpName)
  )
    throw Error(
      `Invalid execution client ${executionClient} for network ${network}`
    );
  // Ensure Consensus clients DNP's names are valid
  if (
    consensusClient &&
    !compatibleConsensus
      .map((coCl) => coCl.dnpName)
      .includes(consensusClient.dnpName)
  )
    throw Error(
      `Invalid consensus client ${consensusClient} for network ${network}`
    );

  // Ensure Execution clients DNP's versions names are valid
  if (currentExecClientPkg) {
    const execClient = compatibleExecution.find(
      (exCl) => exCl.dnpName === currentExecClientPkg.dnpName
    );
    if (
      execClient?.minVersion &&
      lt(currentExecClientPkg.version, execClient.minVersion)
    )
      throw Error(
        `Execution client ${currentExecClientPkg.dnpName} version ${currentExecClientPkg.version} is lower than the minimum version ${execClient.minVersion} required to work with the stakers UI. Update it to continue.`
      );
  }

  // Ensure Execution clients DNP's versions names are valid
  if (currentConsClientPkg) {
    const consClient = compatibleConsensus.find(
      (exCl) => exCl.dnpName === currentConsClientPkg.dnpName
    );
    if (
      consClient?.minVersion &&
      lt(currentConsClientPkg.version, consClient.minVersion)
    )
      throw Error(
        `Consensus client ${currentConsClientPkg.dnpName} version ${currentConsClientPkg.version} is lower than the minimum version ${consClient.minVersion} required to work with the stakers UI. Update it to continue.`
      );
  }

  // Ensure Web3signer DNP's version is valid
  if (
    compatibleSigner.minVersion &&
    currentWeb3signerPkg &&
    lt(currentWeb3signerPkg.version, compatibleSigner.minVersion)
  )
    throw Error(
      `Web3signer version ${currentWeb3signerPkg.version} is lower than the minimum version ${compatibleSigner.minVersion} required to work with the stakers UI. Update it to continue.`
    );
}
