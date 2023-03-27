import React from "react";
import newTabProps from "utils/newTabProps";
import { MdHome, MdSettingsRemote, MdSettings, MdInfo } from "react-icons/md";
import { AiFillBug } from "react-icons/ai";
import { Manifest } from "@dappnode/dappnodesdk/types";

export function Links({
  links,
  bugs
}: {
  links: Manifest["links"];
  bugs: Manifest["bugs"];
}) {
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

  if (linksArray && bugs) linksArray.push({ name: "report", url: bugs.url });

  const items = linksArray.map(({ name, url }) =>
    name === "homepage" ||
    name === "ui" ||
    name === "webui" ||
    name === "gateway" ||
    name === "report" ? (
      <a className="links-url" href={url} {...newTabProps}>
        <span className="links-icon">
          {name === "homepage" ? (
            <MdInfo />
          ) : name === "ui" || name === "webui" ? (
            <MdHome />
          ) : name === "gateway" ? (
            <MdSettingsRemote />
          ) : name === "report" ? (
            <AiFillBug />
          ) : null}
        </span>
        <span className="links-name">{name}</span>
      </a>
    ) : name === "api" || name === "queryingApi" || name === "endpoint" ? (
      <span className="api-link-container">
        <a href={url} {...newTabProps}>
          <span className="links-icon">
            <MdSettings />
          </span>
          <span>Querying API</span>
        </a>
        <div className="api-link-box">{url}</div>
      </span>
    ) : name === "apiEngine" || name === "engineAPI" ? (
      <span className="api-link-container">
        <a href={url} {...newTabProps}>
          <span className="links-icon">
            <MdSettings />
          </span>
          <span>Engine API</span>
        </a>
        <div className="api-link-box">{url}</div>
      </span>
    ) : (
      <a className="unknown-link-container" href={url} {...newTabProps}>
        {name || url || "unnamed"}
      </a>
    )
  );

  return (
    <div>
      {items.map((item, i) => (
        <div key={i}>{item}</div>
      ))}
    </div>
  );
}
