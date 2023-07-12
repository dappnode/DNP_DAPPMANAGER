import React from "react";
import { useChainData } from "hooks/chainData";
import ProgressBar from "react-bootstrap/ProgressBar";
import Card from "components/Card";
import RenderMarkdown from "components/RenderMarkdown";
import { prettyDnpName } from "utils/format";
import { ChainData } from "@dappnode/common";
import { HelpTo } from "components/Help";
import { Link } from "react-router-dom";
import { rootPath as packagesRootPath } from "pages/packages";

export function ChainCards() {
  const chainData = useChainData();

  return (
    <div className="dashboard-cards">
      {chainData.map(chain => (
        <ChainCard key={chain.dnpName} {...chain} />
      ))}
    </div>
  );
}

function ChainCard(chain: ChainData) {
  const {
    dnpName,
    name,
    message,
    help,
    progress,
    error,
    syncing,
    peers
  } = chain;
  return (
    <Card className="chain-card">
      <div className="name">
        <span className="text">{name || prettyDnpName(dnpName)}</span>
        {help && <HelpTo url={help} />}
      </div>

      {syncing ? (
        typeof progress === "number" &&
        (progress === 0 ? (
          <ProgressBar now={100} animated={true} label={`Syncing`} />
        ) : (
          <ProgressBar
            now={progress * 100}
            animated={true}
            label={`${(Math.floor(progress * 10000) / 100).toFixed(2)}%`}
          />
        ))
      ) : error ? (
        <ProgressBar now={100} variant="warning" />
      ) : (
        <ProgressBar now={100} variant="success" />
      )}

      <div className="message">
        {(dnpName === "repository-source" ||
          !syncing ||
          (typeof progress === "number" && progress !== 0)) && (
          <RenderMarkdown source={message} noMargin />
        )}
        {peers && <RenderMarkdown source={`Peers: ${peers}`} noMargin />}
        {error ? (
          <Link to={`${packagesRootPath}/${dnpName}/logs`}>More info</Link>
        ) : null}
      </div>
    </Card>
  );
}
