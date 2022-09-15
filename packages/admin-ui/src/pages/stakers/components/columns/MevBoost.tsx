import React from "react";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { joinCssClass } from "utils/css";
import { StakerItem } from "common";
import "./columns.scss";
import defaultAvatar from "img/defaultAvatar.png";
import errorAvatar from "img/errorAvatarTrim.png";

export default function MevBoost({
  mevBoost,
  setEnableMevBoost,
  isSelected,
  ...props
}: {
  mevBoost: StakerItem;
  setEnableMevBoost: (installMevBoost: boolean) => void;
  isSelected: boolean;
}) {
  return (
    <Card
      {...props}
      className={`mev-boost ${joinCssClass({ isSelected })}`}
      onClick={() => setEnableMevBoost(!isSelected)}
      shadow={isSelected}
    >
      <div className="avatar">
        <img
          src={
            mevBoost.status === "error"
              ? errorAvatar
              : mevBoost.avatarUrl || defaultAvatar
          }
          alt="avatar"
        />
      </div>
      <div className="title">
        {prettyDnpName(mevBoost.dnpName)}{" "}
        {mevBoost.status === "ok" && mevBoost.metadata.version}
      </div>
      {mevBoost.status === "ok" && (
        <div className="description">{mevBoost.metadata.description}</div>
      )}
    </Card>
  );
}
