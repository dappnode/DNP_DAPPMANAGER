import React from "react";
import {DataList} from "./DataList";
// Utils
import newTabProps from "utils/newTabProps";
import { MdHome, MdSettingsRemote, MdSettings, MdInfo } from "react-icons/md";
import { PackageReleaseMetadata } from "types";

export function Links({ links }: { links: PackageReleaseMetadata["links"] }) {
  const linksArray =
    typeof links === "object"
      ? Object.entries(links || {})
          .map(([name, url]) => ({ name, url }))
          .filter(({ url }) => url)
          // Place homepage first
          .sort(l1 => (l1.name === "homepage" ? -1 : 0))
      : typeof links === "string"
      ? [{ name: "homepage", url: links }]
      : [];

  return (
    <DataList
      title={"Links"}
      data={linksArray.map(({ name, url }) =>
        name === "homepage" ||
        name === "ui" ||
        name === "webui" ||
        name === "gateway" ? (
          <a className="links-url" href={url} {...newTabProps}>
            <span className="links-icon">
              {name === "homepage" ? (
                <MdInfo />
              ) : name === "ui" || name === "webui" ? (
                <MdHome />
              ) : name === "gateway" ? (
                <MdSettingsRemote />
              ) : null}
            </span>
            <span>{name}</span>
          </a>
        ) : name === "api" || name === "endpoint" ? (
          <span className="api-link-container">
            <a href={url} {...newTabProps}>
              <span className="links-icon">
                <MdSettings />
              </span>
              <span>Api</span>
            </a>
            <div className="api-link-box">{url}</div>
          </span>
        ) : (
          <a className="unknown-link-container" href={url} {...newTabProps}>
            {name || url || "unnamed"}
          </a>
        )
      )}
    />
  );
}
