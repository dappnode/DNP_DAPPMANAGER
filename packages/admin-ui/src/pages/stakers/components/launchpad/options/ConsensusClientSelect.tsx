import { Network, StakerItemOk } from "@dappnode/common";
import React from "react";
import ConsensusClient from "../../columns/ConsensusClient";

export default function ConsensusClientSelect<T extends Network>({
  consensusClients,
  setNewConsClient,
  newConsClient
}: {
  consensusClients: StakerItemOk<T, "consensus">[];
  setNewConsClient: React.Dispatch<
    React.SetStateAction<StakerItemOk<T, "consensus"> | undefined>
  >;
  newConsClient?: StakerItemOk<T, "consensus">;
}) {
  return (
    <>
      {consensusClients.map((consensusClient, i) => (
        <ConsensusClient<T>
          key={i}
          consensusClient={consensusClient}
          setNewConsClient={setNewConsClient}
          newConsClient={newConsClient}
          isSelected={consensusClient.dnpName === newConsClient?.dnpName}
          graffitiError={null}
          feeRecipientError={null}
          defaultGraffiti={"validating_from_DAppNode"}
          defaultFeeRecipient={"0x00000000000000000000000"}
          defaultCheckpointSync={"http://"}
        />
      ))}
    </>
  );
}
