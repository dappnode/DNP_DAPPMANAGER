import React from "react";
import Card from "components/Card";
import { BsCircle, BsCircleFill } from "react-icons/bs";
import { prettyDnpName } from "utils/format";

export default function ExecutionClient({
  executionClient,
  setNewExecClient,
  isInstalled,
  isSelected
}: {
  executionClient: string;
  setNewExecClient: (executionClient: string) => void;
  isInstalled: boolean;
  isSelected: boolean;
}) {
  return (
    <Card onClick={() => setNewExecClient(executionClient)} shadow={isSelected}>
      <p>{prettyDnpName(executionClient)}</p>
      {isInstalled ? <BsCircleFill /> : <BsCircle />} Installed <br />
      {isSelected ? <BsCircleFill /> : <BsCircle />} Selected
    </Card>
  );
}
