import React from "react";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { joinCssClass } from "utils/css";
import { StakerItem } from "common";
import "./columns.scss";
import defaultAvatar from "img/defaultAvatar.png";
import errorAvatar from "img/errorAvatarTrim.png";
import Button from "components/Button";
import { rootPath as installedRootPath } from "pages/installer";
import { Link } from "react-router-dom";

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
      {mevBoost.status === "ok" ? (
        <div className="avatar">
          <img src={mevBoost.avatarUrl || defaultAvatar} alt="avatar" />
        </div>
      ) : mevBoost.status === "error" ? (
        <div className="avatar">
          <img src={errorAvatar} alt="avatar" />
        </div>
      ) : null}

      <div className="title">{prettyDnpName(mevBoost.dnpName)} </div>

      {mevBoost.status === "ok" &&
        isSelected &&
        mevBoost.isInstalled &&
        !mevBoost.isUpdated && (
          <>
            <Link to={`${installedRootPath}/${mevBoost.dnpName}`}>
              <Button variant="dappnode">UPDATE</Button>
            </Link>
            <br />
            <br />
          </>
        )}

      {mevBoost.status === "ok" && (
        <div className="description">
          {isSelected && mevBoost.metadata.shortDescription}
        </div>
      )}
    </Card>
  );
}
