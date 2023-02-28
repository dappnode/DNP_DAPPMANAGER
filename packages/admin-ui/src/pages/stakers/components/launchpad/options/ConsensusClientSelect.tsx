import { Network, StakerItemOk } from "@dappnode/common";
import React from "react";

export default function ConsensusClientSelect<T extends Network>({
  consensusClients
}: {
  consensusClients: StakerItemOk<T, "consensus">[];
}) {
  return <div></div>;
}
