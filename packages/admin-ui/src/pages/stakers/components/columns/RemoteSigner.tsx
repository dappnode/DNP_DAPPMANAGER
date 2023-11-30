import React from "react";
import Card from "components/Card";
import { prettyDnpName } from "utils/format";
import { joinCssClass } from "utils/css";
import defaultAvatar from "img/defaultAvatar.png";
import errorAvatar from "img/errorAvatarTrim.png";
import { StakerItem, Network } from "@dappnode/common";
import Button from "components/Button";
import { getInstallerPath } from "pages/installer";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

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
            <Button
              onClick={() =>
                navigate(
                  `${getInstallerPath(signer.dnpName)}/${signer.dnpName}`
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

      {signer.status === "ok" &&
        isSelected &&
        signer.isInstalled &&
        signer.data?.manifest.links?.ui && (
          <div
            style={{
              alignItems: "center",
              textTransform: "capitalize",
              whiteSpace: "nowrap"
            }}
          >
            <a
              href={signer.data.manifest.links.ui}
              target="_blank"
              rel="noreferrer noopener"
            >
              <FaKey /> {"  "} Upload keystores
            </a>
          </div>
        )}

      {signer.status === "ok" && (
        <div className="description">
          {isSelected && signer.data && signer.data.manifest.shortDescription}
        </div>
      )}
    </Card>
  );
}
