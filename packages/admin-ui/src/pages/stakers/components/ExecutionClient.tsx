import React from "react";
import Card from "components/Card";

export default function ExecutionClient({
  executionClient,
  isInstalled,
  isSelected
}: {
  executionClient: string;
  isInstalled: boolean;
  isSelected: boolean;
}) {
  return (
    <Card>
      <p>{executionClient}</p>
    </Card>
  );
}
