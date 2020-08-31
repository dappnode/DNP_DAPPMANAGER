import React, { useState, useEffect } from "react";
import { api } from "api";
// Components
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import RenderMarkdown from "components/RenderMarkdown";
import { MdClose } from "react-icons/md";
// This
import { Links } from "./Links";
import { Vols } from "./Vols";
import { StateBadge } from "../StateBadge";
import newTabProps from "utils/newTabProps";
import { InstalledPackageData, Manifest } from "types";
import { ipfsGatewayUrl } from "pages/system/data";
import "./info.scss";

export function Info({
  dnp,
  manifest,
  gettingStarted,
  gettingStartedShow
}: {
  dnp: InstalledPackageData;
  manifest?: Manifest;
  gettingStarted?: string;
  gettingStartedShow?: boolean;
}) {
  const [gettingStartedShowLocal, setGettingStartedIsShown] = useState(false);
  const [loading, setLoading] = useState(false);

  const { dnpName, origin } = dnp;
  const { version, upstreamVersion, links } = manifest || {};

  useEffect(() => {
    setGettingStartedIsShown(Boolean(gettingStartedShow));
  }, [gettingStartedShow]);

  async function hideGettingStarted() {
    if (!loading)
      try {
        setLoading(true);
        setGettingStartedIsShown(false);
        if (gettingStartedShow)
          await api.packageGettingStartedToggle({ dnpName, show: false });
      } catch (e) {
        console.error(`Error on packageGettingStartedToggle: ${e.stack}`);
      } finally {
        setLoading(false);
      }
  }

  if (!dnp) return null;

  return (
    <>
      {gettingStartedShowLocal && gettingStarted && (
        <>
          <SubTitle
            className={`getting-started-header ${loading ? "loading" : ""}`}
          >
            <div>Getting started</div>
            <div>
              <MdClose onClick={hideGettingStarted} />
            </div>
          </SubTitle>
          <Card className="getting-started-content">
            <RenderMarkdown source={gettingStarted} />
            <div className="subtle-header" onClick={hideGettingStarted}>
              Dismiss
            </div>
          </Card>
        </>
      )}

      <SubTitle>Details</SubTitle>
      <Card>
        <div>
          <strong>Status: </strong>
          {dnp.containers.map(container => (
            <StateBadge key={container.serviceName} state={container.state} />
          ))}
        </div>

        <div className="version-info">
          <strong>Version: </strong>
          {version} {upstreamVersion && `(${upstreamVersion} upstream)`}{" "}
          {origin ? (
            <a href={`${ipfsGatewayUrl}${origin}`} {...newTabProps}>
              {origin}
            </a>
          ) : null}
        </div>

        {!gettingStartedShowLocal && (
          <div>
            <strong>Getting started: </strong>
            <span
              className="a-style"
              onClick={() => setGettingStartedIsShown(true)}
            >
              show
            </span>
          </div>
        )}

        <div>
          {dnp.containers.map(container => (
            <Vols
              key={container.serviceName}
              dnpName={dnpName}
              volumes={container.volumes}
            />
          ))}
        </div>

        <div>
          {/* Support legacy manifests,  homepage = {userui: "http://some.link"} */}
          <Links links={links || ((manifest as any) || {}).homepage || {}} />
        </div>
      </Card>
    </>
  );
}
