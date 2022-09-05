import React from "react";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { joinCssClass } from "utils/css";
import "./columns.scss";

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
    <Card
      className={`execution-client ${joinCssClass({ isSelected })}`}
      onClick={
        isSelected
          ? () => setNewExecClient("")
          : () => setNewExecClient(executionClient)
      }
      shadow={isSelected}
    >
      <div className="title">{prettyDnpName(executionClient)}</div>
    </Card>
  );
}
