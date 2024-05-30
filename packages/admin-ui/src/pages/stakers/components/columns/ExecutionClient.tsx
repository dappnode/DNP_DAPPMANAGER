import React from "react";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { joinCssClass } from "utils/css";
import { StakerItem, StakerItemOk } from "@dappnode/types";
import defaultAvatar from "img/defaultAvatar.png";
import errorAvatar from "img/errorAvatarTrim.png";
import Button from "components/Button";
import { getInstallerPath } from "pages/installer";
import { useNavigate } from "react-router-dom";

export default function ExecutionClient({
  executionClient,
  setNewExecClient,
  isSelected,
  ...props
}: {
  executionClient: StakerItem;
  setNewExecClient: React.Dispatch<React.SetStateAction<StakerItemOk | null>>;
  isSelected: boolean;
}) {
  const navigate = useNavigate();
  return (
    <Card
      {...props}
      className={`execution-client ${joinCssClass({ isSelected })}`}
      onClick={
        executionClient.status === "ok"
          ? isSelected
            ? () => setNewExecClient(null)
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
            <Button
              onClick={() =>
                navigate(
                  `${getInstallerPath(executionClient.dnpName)}/${
                    executionClient.dnpName
                  }`
                )
              }
              variant="dappnode"
            >
              UPDATE
            </Button>
            <br />
            <br />
          </>
        )}

      {executionClient.status === "ok" && (
        <div className="description">
          {isSelected && executionClient.data?.manifest?.shortDescription}
        </div>
      )}
    </Card>
  );
}
