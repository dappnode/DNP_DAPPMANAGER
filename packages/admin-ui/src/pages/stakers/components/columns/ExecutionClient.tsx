import React from "react";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { joinCssClass } from "utils/css";
import defaultAvatar from "img/defaultAvatar.png";
import "./columns.scss";
import { StakerItem } from "common";

export default function ExecutionClient({
  executionClient,
  setNewExecClient,
  isSelected,
  ...props
}: {
  executionClient: StakerItem;
  setNewExecClient: (executionClient: string) => void;
  isSelected: boolean;
}) {
  return (
    <Card
      {...props}
      className={`execution-client ${joinCssClass({ isSelected })}`}
      onClick={
        isSelected
          ? () => setNewExecClient("")
          : () => setNewExecClient(executionClient.dnpName)
      }
      shadow={isSelected}
    >
      <div className="avatar">
        <img src={executionClient.avatarUrl || defaultAvatar} alt="avatar" />
      </div>
      <div className="title">
        {prettyDnpName(executionClient.dnpName)}{" "}
        {executionClient.metadata.version}
      </div>
      <div className="description">{executionClient.metadata.description}</div>
    </Card>
  );
}
