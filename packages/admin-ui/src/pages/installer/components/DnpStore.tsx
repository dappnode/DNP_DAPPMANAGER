import React from "react";
// Imgs
import defaultAvatar from "img/defaultAvatar.png";
import loadingAvatar from "img/light-gray-square.png";
import errorAvatar from "img/errorAvatarTrim.png";
// Utility components
import Card from "components/Card";
import Button from "components/Button";
import DnpNameVerified from "components/DnpNameVerified";
import {
  DirectoryItem,
  DirectoryItemOk,
  DirectoryItemLoading,
  DirectoryItemError
} from "types";
import "./dnpStore.scss";

function getTag({
  isUpdated,
  isInstalled
}: {
  isUpdated: boolean;
  isInstalled: boolean;
}) {
  return isUpdated ? "UPDATED" : isInstalled ? "UPDATE" : "GET";
}

/**
 * Featured DNPs. Their size will be double a normal DNP card
 * Their style is customizable via the manifest
 */
function DnpCardFeaturedOk({
  directoryItem: { name, description, avatarUrl, featuredStyle },
  ...props
}: {
  directoryItem: DirectoryItemOk;
}) {
  const { featuredBackground, featuredColor, featuredAvatarFilter } =
    featuredStyle || {};
  return (
    <Card
      {...props}
      style={{ background: featuredBackground, color: featuredColor }}
    >
      <div className="avatar-big">
        <img
          style={{ filter: featuredAvatarFilter }}
          src={avatarUrl || defaultAvatar}
          alt="avatar"
        />
      </div>
      <div className="info-big">
        <div className="badge gray featured">Featured</div>
        <DnpNameVerified name={name} big />
        <div className="description">{description}</div>
      </div>
    </Card>
  );
}

function DnpCardFeaturedLoading({
  directoryItem: { name, message },
  className,
  ...props
}: {
  directoryItem: DirectoryItemLoading;
  className: string;
}) {
  return (
    <Card {...props} className={`${className} loading`}>
      <div className="avatar-big">
        <img src={loadingAvatar} alt="avatar" />
      </div>
      <div className="info-big">
        <div className="badge gray featured">Featured</div>
        <DnpNameVerified name={name} big />
        <div className="description">{message}</div>
      </div>
    </Card>
  );
}

function DnpCardOk({
  directoryItem,
  ...props
}: {
  directoryItem: DirectoryItemOk;
}) {
  const { name, description, avatarUrl, isUpdated } = directoryItem;
  return (
    <Card {...props}>
      <div className="avatar">
        <img src={avatarUrl || defaultAvatar} alt="avatar" />
      </div>
      <DnpNameVerified name={name} />
      {/* <div className="badge">New version available</div> */}
      <div className="description">{description}</div>
      {/* Show the button as disabled (gray) if it's updated */}
      <Button className="action" variant="dappnode" disabled={isUpdated}>
        {getTag(directoryItem)}
      </Button>
    </Card>
  );
}

function DnpCardLoading({
  directoryItem: { name, message },
  className,
  ...props
}: {
  directoryItem: DirectoryItemLoading;
  className: string;
}) {
  return (
    <Card {...props} className={`${className} loading`}>
      <div className="avatar">
        <img src={loadingAvatar} alt="avatar" />
      </div>
      <DnpNameVerified name={name} />
      <div className="description">{message}</div>
      <Button className="action" variant="dappnode" disabled={true}>
        {"-"}
      </Button>
    </Card>
  );
}

function DnpCardError({
  directoryItem: { name, message },
  className,
  ...props
}: {
  directoryItem: DirectoryItemError;
  className: string;
}) {
  return (
    <Card {...props} className={`${className} error`}>
      <div className="avatar">
        <img src={errorAvatar} alt="avatar" />
      </div>
      <DnpNameVerified name={name} />
      <div className="description">{message}</div>
      <Button className="action" variant="dappnode" disabled={true}>
        ERROR
      </Button>
    </Card>
  );
}

function DnpStore({
  directory,
  openDnp,
  featured
}: {
  directory: DirectoryItem[];
  openDnp: (id: string) => void;
  featured?: boolean;
}) {
  // If there are no DNPs, don't render the component to prevent wierd empty spaces
  if (!directory.length) return null;

  return (
    <div className={`dnp-cards ${featured ? "featured" : ""}`}>
      {directory.map(directoryItem => {
        const cardProps = {
          onClick: () => openDnp(directoryItem.name),
          className: "dnp-card",
          shadow: true
        };

        return (
          <React.Fragment key={directoryItem.name}>
            {directoryItem.status === "ok" ? (
              directoryItem.isFeatured ? (
                <DnpCardFeaturedOk {...{ ...cardProps, directoryItem }} />
              ) : (
                <DnpCardOk {...{ ...cardProps, directoryItem }} />
              )
            ) : directoryItem.status === "loading" ? (
              directoryItem.isFeatured ? (
                <DnpCardFeaturedLoading {...{ ...cardProps, directoryItem }} />
              ) : (
                <DnpCardLoading {...{ ...cardProps, directoryItem }} />
              )
            ) : directoryItem.status === "error" ? (
              <DnpCardError {...{ ...cardProps, directoryItem }} />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Use `compose` from "redux" if you need multiple HOC
export default DnpStore;
