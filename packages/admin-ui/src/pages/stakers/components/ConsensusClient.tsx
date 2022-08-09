import React from "react";
import Card from "components/Card";

export default function ConsensusClient({
  consensusClient,
  isInstalled,
  isSelected
}: {
  consensusClient: string;
  isInstalled: boolean;
  isSelected: boolean;
}) {
  return (
    <Card>
      <p>{consensusClient}</p>
    </Card>
  );
}
