import React from "react";
import Card from "components/Card";
import ProgressBar from "react-bootstrap/ProgressBar";
import RenderMarkdown from "components/RenderMarkdown";
import { shortNameCapitalized } from "utils/format";
import { ChainData } from "types";
import { HelpTo } from "components/Help";

export default function ChainCard(chain: ChainData) {
  const { dnpName, name, message, help, progress, error, syncing } = chain;
  return (
    <Card className="chain-card">
      <div className="name">
        <span className="text">{name || shortNameCapitalized(dnpName)}</span>
        {help && <HelpTo url={help} />}
      </div>

      {syncing ? (
        typeof progress === "number" && (
          <ProgressBar
            now={progress * 100}
            animated={true}
            label={`${Math.floor(progress * 100)}%`}
          />
        )
      ) : error ? (
        <ProgressBar now={100} variant="danger" />
      ) : (
        <ProgressBar now={100} variant="success" />
      )}

      <div className="message">
        <RenderMarkdown source={message} noMargin />
      </div>
    </Card>
  );
}
