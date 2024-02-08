import React from "react";
import { ZKEVMItem } from "@dappnode/common";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { joinCssClass } from "utils/css";
import defaultAvatar from "img/defaultAvatar.png";
import errorAvatar from "img/errorAvatarTrim.png";
import Button from "components/Button";
import { getInstallerPath } from "pages/installer";
import { useNavigate } from "react-router-dom";

const ZkEvm = ({
  zkEvmItem, // Rename ZKEVMItem to zkEvmItem
  setNewZkEvmItem, // Rename setNewZKEVMItem to setNewZkEvmItem
  isSelected,
  ...props
}: {
  zkEvmItem: ZKEVMItem<"rollup">; // Specify the type argument "rollup"
  setNewZkEvmItem: React.Dispatch<React.SetStateAction<ZKEVMItem<"rollup"> | undefined>>; // Specify the type argument "rollup"
  isSelected: boolean;
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (zkEvmItem.status === "ok") {
      if (isSelected) {
        // If already selected, deselect
        setNewZkEvmItem(undefined);
      } else {
        // If not selected, select
        setNewZkEvmItem(zkEvmItem);
      }
    }
  };

  const handleUpdateClick = () => {
    navigate(`${getInstallerPath(zkEvmItem.dnpName)}/${zkEvmItem.dnpName}`);
  };

  return (
    <Card
      {...props}
      className={`zk-evm-node ${joinCssClass({ isSelected })}`}
      shadow={isSelected}
      onClick={handleClick}
    >
      {zkEvmItem.status === "ok" ? (
        <div className="avatar">
          <img src={zkEvmItem.avatarUrl || defaultAvatar} alt="avatar" />
        </div>
      ) : zkEvmItem.status === "error" ? (
        <div className="avatar">
          <img src={errorAvatar} alt="avatar" />
        </div>
      ) : null}

      <div className="title">{prettyDnpName(zkEvmItem.dnpName)} </div>

      {zkEvmItem.status === "ok" && isSelected && (
        <>
          <Button onClick={handleUpdateClick} variant="dappnode">
            UPDATE
          </Button>
          <br />
          <br />
        </>
      )}

      {zkEvmItem.status === "ok" && (
        <div className="description">
          {isSelected && zkEvmItem.data?.manifest?.shortDescription}
        </div>
      )}
    </Card>
  );
};

export default ZkEvm;
