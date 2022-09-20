import React from "react";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { joinCssClass } from "utils/css";
import defaultAvatar from "img/defaultAvatar.png";
import errorAvatar from "img/errorAvatarTrim.png";
import "./columns.scss";
import { StakerItem } from "common";

export default function RemoteSigner({
  signer,
  setEnableWeb3signer,
  isSelected,
  ...props
}: {
  signer: StakerItem;
  setEnableWeb3signer: (installWeb3signer: boolean) => void;
  isSelected: boolean;
}) {
  return (
    <Card
      {...props}
      className={`remote-signer ${joinCssClass({ isSelected })}`}
      onClick={() => setEnableWeb3signer(!isSelected)}
      shadow={isSelected}
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

      <div className="title">
        {prettyDnpName(signer.dnpName)}{" "}
        {signer.status === "ok" && signer.metadata.version}
      </div>

      {signer.status === "ok" && (
        <div className="description">
          {isSelected
            ? signer.metadata.description
            : signer.metadata.shortDescription}
        </div>
      )}
    </Card>
  );
}
