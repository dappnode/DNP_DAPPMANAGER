import React from "react";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { joinCssClass } from "utils/css";
import "./columns.scss";
import { Network, StakerItem, StakerItemOk } from "@dappnode/common";
import defaultAvatar from "img/defaultAvatar.png";
import errorAvatar from "img/errorAvatarTrim.png";
import Button from "components/Button";
import { rootPath as installedRootPath } from "pages/installer";
import { Link } from "react-router-dom";

export default function ExecutionClient<T extends Network>({
  executionClient,
  setNewExecClient,
  isSelected,
  ...props
}: {
  executionClient: StakerItem<T, "execution">;
  setNewExecClient: React.Dispatch<
    React.SetStateAction<StakerItemOk<T, "execution"> | undefined>
  >;
  isSelected: boolean;
}) {
  return (
    <Card
      {...props}
      className={`execution-client ${joinCssClass({ isSelected })}`}
      onClick={
        executionClient.status === "ok"
          ? isSelected
            ? () => setNewExecClient(undefined)
            : () => setNewExecClient(executionClient)
          : undefined
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

      <div className="title">{prettyDnpName(executionClient.dnpName)} </div>

      {executionClient.status === "ok" &&
        isSelected &&
        executionClient.isInstalled &&
        !executionClient.isUpdated && (
          <>
            <Link to={`${installedRootPath}/${executionClient.dnpName}`}>
              <Button variant="dappnode">UPDATE</Button>
            </Link>
            <br />
            <br />
          </>
        )}

      {executionClient.status === "ok" && (
        <div className="description">
          {isSelected &&
            executionClient.data &&
            executionClient.data.metadata.shortDescription}
        </div>
      )}
    </Card>
  );
}
