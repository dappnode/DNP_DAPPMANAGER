import React from "react";
import { useChainData } from "hooks/chainData";
import ProgressBar from "react-bootstrap/ProgressBar";
import Card from "components/Card";
import RenderMarkdown from "components/RenderMarkdown";
import { prettyDnpName } from "utils/format";
import { AddEthereumChainParameter, ChainData } from "@dappnode/types";
import { HelpTo } from "components/Help";
import { Link } from "react-router-dom";
import { relativePath as packagesRelativePath } from "pages/packages";
import Button from "components/Button";
import { FaWallet } from "react-icons/fa";

// set window.ethereum to any to avoid typescript error
declare global {
  interface Window {
    ethereum: any;
  }
}

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
    peers,
    wallet
  } = chain;

  async function connectWallet(wallet: AddEthereumChainParameter) {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: wallet.chainId,
          chainName: wallet.chainName,
          rpcUrls: wallet.rpcUrls,
          nativeCurrency: wallet.nativeCurrency,
          blockExplorerUrls: wallet.blockExplorerUrls
        }
      ]
    });
  }

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
        <>
          <ProgressBar now={100} variant="success" />
          {/** Button with icon wallet to connect wallet */}
          {wallet && (
            <Button
              variant="dappnode"
              size="sm"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => connectWallet(wallet)}
            >
              <FaWallet />
              Connect wallet
            </Button>
          )}
        </>
      )}

      <div className="message">
        {(dnpName === "repository-source" ||
          !syncing ||
          (typeof progress === "number" && progress !== 0)) && (
          <RenderMarkdown source={message} noMargin />
        )}
        {peers && <RenderMarkdown source={`Peers: ${peers}`} noMargin />}
        {error ? (
          <Link to={`/${packagesRelativePath}/${dnpName}/logs`}>More info</Link>
        ) : null}
      </div>
    </Card>
  );
}
