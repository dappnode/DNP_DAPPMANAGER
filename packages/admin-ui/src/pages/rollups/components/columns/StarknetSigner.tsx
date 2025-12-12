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

export default function StarknetSigner({
  signer,
  setNewSigner,
  isSelected,
  ...props
}: {
  signer: StakerItem;
  setNewSigner: React.Dispatch<React.SetStateAction<StakerItemOk | null>>;
  isSelected: boolean;
}) {
  const navigate = useNavigate();

  return (
    <Card
      {...props}
      className={`starknet-node ${joinCssClass({ isSelected })}`}
      shadow={isSelected}
      onClick={
        signer.status === "ok"
          ? isSelected
            ? () => setNewSigner(null)
            : () => setNewSigner(signer)
          : undefined
      }
    >
      {signer.status === "ok" ? (
        <div className="avatar">
          <img src={signer.avatarUrl || defaultAvatar} alt="avatar" />
        </div>
      ) : signer.status === "error" ? (
        <div className="avatar">
          <img src={errorAvatar} alt="avatar" />
        </div>
      ) : null}

      <div className="title">{prettyDnpName(signer.dnpName)} </div>

      {signer.status === "ok" && isSelected && signer.isInstalled && !signer.isUpdated && (
        <>
          <Button
            onClick={() => navigate(`${getInstallerPath(signer.dnpName)}/${signer.dnpName}`)}
            variant="dappnode"
          >
            UPDATE
          </Button>
          <br />
          <br />
        </>
      )}

      {signer.status === "ok" && (
        <div className="description">{isSelected && signer.data?.manifest?.shortDescription}</div>
      )}
    </Card>
  );
}
