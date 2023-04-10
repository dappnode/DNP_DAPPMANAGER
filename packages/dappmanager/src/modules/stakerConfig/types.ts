import { ExecutionClient, Network, Signer } from "@dappnode/common";

export type ExecutionClientOrSignerVersions<T extends Network> = {
  [key in Exclude<ExecutionClient<T> | Signer<T>, "">]: string;
};

export type LodestarStakersMinimumVersions<T extends Network> = {
  [key in T]: ExecutionClientOrSignerVersions<T>;
};
