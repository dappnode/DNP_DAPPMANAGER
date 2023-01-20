import React from "react";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { joinCssClass } from "utils/css";
import defaultAvatar from "img/defaultAvatar.png";
import errorAvatar from "img/errorAvatarTrim.png";
import "./columns.scss";
import { Network, StakerItem } from "@dappnode/common";
import Button from "components/Button";
import { rootPath as installedRootPath } from "pages/installer";
import { Link } from "react-router-dom";
import { FaKey } from "react-icons/fa";

export default function RemoteSigner<T extends Network>({
  signer,
  setEnableWeb3signer,
  isSelected,
  ...props
}: {
  signer: StakerItem<T, "signer">;
  setEnableWeb3signer: (installWeb3signer: boolean) => void;
  isSelected: boolean;
}) {
  return (
    <Card
      {...props}
      className={`remote-signer ${joinCssClass({ isSelected })}`}
      shadow={isSelected}
    >
      <div onClick={() => setEnableWeb3signer(!isSelected)}>
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
      </div>

      {signer.status === "ok" &&
        isSelected &&
        signer.isInstalled &&
        !signer.isUpdated && (
          <>
            <Link to={`${installedRootPath}/${signer.dnpName}`}>
              <Button variant="dappnode">UPDATE</Button>
            </Link>
            <br />
            <br />
          </>
        )}

      {signer.status === "ok" &&
        isSelected &&
        signer.isInstalled &&
        signer.data?.metadata.links?.ui && (
          <div
            style={{
              alignItems: "center",
              textTransform: "capitalize",
              whiteSpace: "nowrap"
            }}
          >
            <a
              href={signer.data.metadata.links.ui}
              target="_blank"
              rel="noreferrer noopener"
            >
              <FaKey /> {"  "} Upload keystores
            </a>
          </div>
        )}

      {signer.status === "ok" && (
        <div className="description">
          {isSelected && signer.data && signer.data.metadata.shortDescription}
        </div>
      )}
    </Card>
  );
}
