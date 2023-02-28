import { Network, StakerItemOk } from "@dappnode/common";
import React from "react";
import ExecutionClient from "../../columns/ExecutionClient";

export default function ExecutionClientsSelect<T extends Network>({
  executionClients,
  setNewExecClient,
  newExecClient
}: {
  executionClients: StakerItemOk<T, "execution">[];
  setNewExecClient: React.Dispatch<
    React.SetStateAction<StakerItemOk<T, "execution"> | undefined>
  >;
  newExecClient?: StakerItemOk<T, "execution">;
}) {
  return (
    <div>
      {executionClients.map((executionClient, i) => (
        <ExecutionClient<T>
          key={i}
          executionClient={executionClient}
          setNewExecClient={setNewExecClient}
          isSelected={executionClient.dnpName === newExecClient?.dnpName}
        />
      ))}
    </div>
  );
}
