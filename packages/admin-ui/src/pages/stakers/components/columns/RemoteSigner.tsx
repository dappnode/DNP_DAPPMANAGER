import React from "react";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { joinCssClass } from "utils/css";
import defaultAvatar from "img/defaultAvatar.png";
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
      <div className="avatar">
        <img src={signer.avatarUrl || defaultAvatar} alt="avatar" />
      </div>
      <div className="title">
        {prettyDnpName(signer.dnpName)} {signer.metadata.version}
      </div>
      <div className="description">{signer.metadata.description}</div>
    </Card>
  );
}
