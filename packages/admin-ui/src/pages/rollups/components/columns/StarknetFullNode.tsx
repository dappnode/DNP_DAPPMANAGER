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

export default function StarknetFullNode({
  fullNode,
  setNewFullNode,
  isSelected,
  ...props
}: {
  fullNode: StakerItem;
  setNewFullNode: React.Dispatch<React.SetStateAction<StakerItemOk | null>>;
  isSelected: boolean;
}) {
  const navigate = useNavigate();

  return (
    <Card {...props} className={`starknet-node ${joinCssClass({ isSelected })}`} shadow={isSelected}>
      <div
        onClick={
          fullNode.status === "ok" ? (isSelected ? () => setNewFullNode(null) : () => setNewFullNode(fullNode)) : undefined
        }
      >
        {fullNode.status === "ok" ? (
          <div className="avatar">
            <img src={fullNode.avatarUrl || defaultAvatar} alt="avatar" />
          </div>
        ) : fullNode.status === "error" ? (
          <div className="avatar">
            <img src={errorAvatar} alt="avatar" />
          </div>
        ) : null}

        <div className="title">{prettyDnpName(fullNode.dnpName)} </div>
      </div>

      {fullNode.status === "ok" && isSelected && fullNode.isInstalled && !fullNode.isUpdated && (
        <>
          <Button onClick={() => navigate(`${getInstallerPath(fullNode.dnpName)}/${fullNode.dnpName}`)} variant="dappnode">
            UPDATE
          </Button>
          <br />
          <br />
        </>
      )}

      {fullNode.status === "ok" && (
        <div className="description">{isSelected && fullNode.data?.manifest?.shortDescription}</div>
      )}
    </Card>
  );
}
