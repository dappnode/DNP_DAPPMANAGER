import { ExecutionClient, Signer } from "@dappnode/common";
import { Network } from "@dappnode/types";

export type ExecutionClientOrSignerVersions<T extends Network> = {
  [key in Exclude<ExecutionClient<T> | Signer<T>, "">]: string;
};

export type LodestarStakersMinimumVersions<T extends Network> = {
  [key in T]: ExecutionClientOrSignerVersions<T>;
};
