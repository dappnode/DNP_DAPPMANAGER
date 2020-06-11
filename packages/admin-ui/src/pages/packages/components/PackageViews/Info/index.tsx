import React, { useState, useEffect } from "react";
import { api } from "api";
// Components
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import RenderMarkdown from "components/RenderMarkdown";
import { MdClose, MdUndo } from "react-icons/md";
import { GoPin } from "react-icons/go";
// This
import Links from "./Links";
import Vols from "./Vols";
import StateBadge from "../StateBadge";
import newTabProps from "utils/newTabProps";
import { PackageContainer, PackageDetailData } from "types";
import "./info.scss";

const ipfsGateway = "http://ipfs.dappnode:8080";

function Info({
  dnp,
  dnpDetail
}: {
  dnp: PackageContainer;
  dnpDetail?: PackageDetailData;
}) {
  const [gettingStartedShowLocal, setGettingStartedIsShown] = useState(false);
  const [allowUndo, setAllowUndo] = useState(false);
  const [loading, setLoading] = useState(false);

  const { manifest, state, origin } = dnp;
  const { description, version, upstreamVersion } = manifest || {};
  const gettingStarted = dnp.gettingStarted || description;
  const gettingStartedShowRemote = dnp.gettingStartedShow;

  useEffect(() => {
    setGettingStartedIsShown(Boolean(gettingStartedShowRemote));
  }, [gettingStartedShowRemote, setGettingStartedIsShown]);

  async function toggleGettingStarted(show: boolean) {
    if (loading) return;
    setLoading(true);
    try {
      await api.packageGettingStartedToggle({ id: dnp.name, show });
    } catch (e) {
      console.error(`Error on packageGettingStartedToggle: ${e.stack}`);
    }
    setLoading(false);
    if (!show) setAllowUndo(true);
  }

  const hideGettingStarted = () => toggleGettingStarted(false);
  const showGettingStarted = () => toggleGettingStarted(true);

  if (!dnp) return null;

  return (
    <>
      {!gettingStarted ? null : gettingStartedShowLocal ? (
        <>
          <SubTitle
            className={`getting-started-header ${loading ? "loading" : ""}`}
          >
            <div>Getting started</div>
            <div>
              {/* Allow the user to "re-pin" the getting started */}
              {!gettingStartedShowRemote && (
                <GoPin onClick={showGettingStarted} />
              )}
              <MdClose onClick={hideGettingStarted} />
            </div>
          </SubTitle>
          <Card className="getting-started-content">
            <RenderMarkdown source={gettingStarted} />
            {gettingStartedShowRemote && (
              <div className="subtle-header" onClick={hideGettingStarted}>
                Dismiss
              </div>
            )}
          </Card>
        </>
      ) : allowUndo ? (
        <SubTitle
          className={`getting-started-header undo ${loading ? "loading" : ""}`}
        >
          <div>Getting started</div>
          <div onClick={showGettingStarted}>
            <span className="undo-text">Undo</span>
            <MdUndo />
          </div>
        </SubTitle>
      ) : null}

      <SubTitle>Details</SubTitle>
      <Card>
        <div>
          <strong>Status: </strong>
          <StateBadge state={state} />
        </div>

        <div className="version-info">
          <strong>Version: </strong>
          {version} {upstreamVersion && `(${upstreamVersion} upstream)`}{" "}
          {origin ? (
            <a href={`${ipfsGateway}${origin}`} {...newTabProps}>
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
          <Vols dnp={dnp} volumesDetail={(dnpDetail || {}).volumes || {}} />
        </div>

        <div>
          <Links dnp={dnp} />
        </div>
      </Card>
    </>
  );
}

export default Info;
