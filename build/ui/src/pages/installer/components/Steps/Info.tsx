import React, { useState } from "react";
import RenderMarkdown from "components/RenderMarkdown";
// This module
import Dependencies from "../InstallCardComponents/Dependencies";
// Utils
import humanFileSize from "utils/humanFileSize";
import getRepoSlugFromManifest from "utils/getRepoSlugFromManifest";
import { shortAuthor } from "utils/format";
import newTabProps from "utils/newTabProps";
// Components
import Button from "components/Button";
import Card from "components/Card";
import ReadMoreMarkdown from "components/ReadMoreMarkdown";
import Columns from "components/Columns";
import Switch from "components/Switch";
import DnpNameVerified from "components/DnpNameVerified";
import Ok from "components/Ok";
import defaultAvatar from "img/defaultAvatar.png";
import { MdExpandMore, MdClose, MdExpandLess } from "react-icons/md";
// Styles
import "./info.scss";
import { RequestedDnp } from "types";

interface OkBadgeProps {
  ok?: boolean;
  loading?: boolean;
  msg: string;
}

const OkBadge: React.FunctionComponent<
  OkBadgeProps & React.HTMLAttributes<HTMLDivElement>
> = ({ ok, loading, msg, ...props }) => {
  const status = ok ? "ok" : loading ? "" : "not-ok";
  return (
    <Ok
      className={`status-badge ${status}`}
      {...{ ok, loading, msg }}
      {...props}
    />
  );
};

interface InstallerStepInfoProps {
  dnp: RequestedDnp;
  onInstall: () => void;
  disableInstallation: boolean;
  optionsArray: {
    id: string;
    name: string;
    checked: boolean;
    toggle: () => void;
  }[];
}

const InstallerStepInfo: React.FunctionComponent<InstallerStepInfoProps> = ({
  dnp,
  onInstall,
  disableInstallation,
  optionsArray
}) => {
  const [showResolveStatus, setShowResolveStatus] = useState(false);
  const [showAvailableStatus, setShowAvailableStatus] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const {
    name,
    request,
    metadata,
    isUpdated,
    isInstalled,
    avatarUrl,
    imageSize,
    origin
  } = dnp || {};

  // Otherwise, show info an allow an install
  const {
    shortDescription,
    description = "No description",
    author = "Unknown",
    version,
    upstreamVersion
  } = metadata;

  const tagDisplay = isUpdated ? "UPDATED" : isInstalled ? "UPDATE" : "INSTALL";

  // If the repoSlug is invalid, it will be returned as null
  const repoSlug = getRepoSlugFromManifest(metadata);

  // Resolution status
  const isCompatible = request.compatible.isCompatible;
  const resolvingCompatibility = request.compatible.resolving;
  const compatibilityError = request.compatible.error;

  /**
   * Construct expandable pannels
   */
  const expandablePanels = [
    {
      name: "Advanced options",
      show: showOptions,
      close: () => setShowOptions(false),
      Component: () => (
        <div>
          {optionsArray.map(({ id, name, checked, toggle }) => (
            <Switch
              key={id}
              checked={checked}
              onToggle={toggle}
              label={name}
              id={"switch-" + id}
            />
          ))}
        </div>
      )
    },
    {
      name: "Compatible status",
      show: showResolveStatus,
      close: () => setShowResolveStatus(false),
      Component: () => (
        <Dependencies
          noCard
          resolving={resolvingCompatibility}
          error={compatibilityError}
          dnps={request.compatible.dnps}
        />
      )
    },
    {
      name: "Available status",
      show: showAvailableStatus,
      close: () => setShowAvailableStatus(false),
      Component: () => <Ok ok={true} msg={"All package resources available"} />
    }
  ].filter(panel => panel.show);

  return (
    <>
      <Card className="installer-header" noscroll>
        <div className="details-header">
          <div className="left avatar">
            <img src={avatarUrl || defaultAvatar} alt="Avatar" />
          </div>
          <div className="right">
            <div className="right-top">
              <div className="info">
                <DnpNameVerified name={name} origin={origin} />
                <div className="subtle-header capitalize">
                  {shortAuthor(author)}
                </div>
                <div className="right-bottom">
                  <OkBadge
                    loading={resolvingCompatibility}
                    ok={isCompatible}
                    msg={
                      isCompatible
                        ? "Compatible"
                        : resolvingCompatibility
                        ? "Resolving"
                        : compatibilityError
                        ? "Not compatible"
                        : "Error"
                    }
                    onClick={() => setShowResolveStatus(x => !x)}
                  />
                  <OkBadge
                    ok={true}
                    msg={"Available"}
                    onClick={() => setShowAvailableStatus(x => !x)}
                  />
                </div>
              </div>
              <div className="actions">
                <Button
                  className="install"
                  variant="dappnode"
                  onClick={onInstall}
                  disabled={disableInstallation}
                >
                  {tagDisplay}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {optionsArray.length > 0 && (
          <div>
            <div
              className="subtle-header capitalize more-options"
              onClick={() => setShowOptions(x => !x)}
            >
              {showOptions ? <MdExpandLess /> : <MdExpandMore />}
              <span>Advanced options</span>
            </div>
          </div>
        )}

        <div className="expandable-info">
          {expandablePanels.map(panel => (
            <div key={panel.name}>
              <div className="subtle-header">
                <span>{panel.name}</span>
                <MdClose onClick={panel.close} />
              </div>
              <panel.Component />
            </div>
          ))}
        </div>

        <Columns className="details-body">
          {/* Left */}
          <div>
            <div className="subtle-header">DESCRIPTION</div>
            <ReadMoreMarkdown source={shortDescription || description} />
            {shortDescription && (
              <>
                <div className="subtle-header">DETAILS</div>
                <ReadMoreMarkdown source={description} />
              </>
            )}
          </div>
          {/* Right */}
          <div>
            <div className="subtle-header">SIZE</div>
            <div>{humanFileSize(imageSize)}</div>
            <div className="subtle-header">VERSION</div>
            <div>
              {repoSlug && version ? (
                <a
                  href={`https://github.com/${repoSlug}/releases/v${version}`}
                  {...newTabProps}
                >
                  {version}
                </a>
              ) : (
                version
              )}{" "}
              {upstreamVersion && `(${upstreamVersion} upstream)`}{" "}
              {origin || ""}
            </div>
            <div className="subtle-header">CREATED BY</div>
            <RenderMarkdown source={author} />
          </div>
        </Columns>
      </Card>
    </>
  );
};

export default InstallerStepInfo;
