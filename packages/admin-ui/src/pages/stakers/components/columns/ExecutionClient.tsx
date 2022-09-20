import React from "react";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { joinCssClass } from "utils/css";
import "./columns.scss";
import { StakerItem } from "common";
import defaultAvatar from "img/defaultAvatar.png";
import errorAvatar from "img/errorAvatarTrim.png";

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
      {executionClient.status === "ok" ? (
        <div className="avatar">
          <img src={executionClient.avatarUrl || defaultAvatar} alt="avatar" />
        </div>
      ) : executionClient.status === "error" ? (
        <div className="avatar">
          <img src={errorAvatar} alt="avatar" />
        </div>
      ) : null}

      <div className="title">
        {prettyDnpName(executionClient.dnpName)}{" "}
        {executionClient.status === "ok" &&
          executionClient.isInstalled &&
          executionClient.metadata.version}
      </div>

      {executionClient.status === "ok" && (
        <div className="description">
          {isSelected && executionClient.metadata.shortDescription}
        </div>
      )}
    </Card>
  );
}
