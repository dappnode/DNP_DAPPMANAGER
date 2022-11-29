import React from "react";
import { useChainData } from "hooks/chainData";
import ProgressBar from "react-bootstrap/ProgressBar";
import Card from "components/Card";
import RenderMarkdown from "components/RenderMarkdown";
import { prettyDnpName } from "utils/format";
import { ChainData, Wallet } from "types";
import { HelpTo } from "components/Help";
import { Link } from "react-router-dom";
import { rootPath as packagesRootPath } from "pages/packages";
import Button from "components/Button";

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
    wallet
  } = chain;
  return (
    <Card className="chain-card">
      <div className="name">
        <span className="text">{name || prettyDnpName(dnpName)}</span>
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
        <ProgressBar now={100} variant="warning" />
      ) : (
        <>
          <ProgressBar now={100} variant="success" />
          {wallet ? <ConnectWallet wallet={wallet} /> : null}
        </>
      )}

      <div className="message">
        <RenderMarkdown source={message} noMargin />
        {error ? (
          <Link to={`${packagesRootPath}/${dnpName}/logs`}>More info</Link>
        ) : null}
      </div>
    </Card>
  );
}

declare global {
  interface Window {
    ethereum: any;
  }
}

function ConnectWallet({ wallet }: { wallet: Wallet }) {
  async function walletConnect() {
    try {
      // https://eips.ethereum.org/EIPS/eip-3326
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: wallet.chainId }]
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          // https://eips.ethereum.org/EIPS/eip-3085
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            // IMPORTANT! RPC without HTTPs is not allowed
            // IMPORTANT! Add new chains with a default chain ID in metamask is not allowed
            params: [
              {
                chainId: wallet.chainId,
                chainName: wallet.chainName,
                rpcUrls: [wallet.rpcUrls]
              }
            ]
          });
        } catch (addError) {
          // handle "add" error
          throw addError;
        }
      }
      // handle other "switch" errors
      throw switchError;
    }
  }

  return (
    <Button variant="dappnode" onClick={() => walletConnect()}>
      Connect Wallet
    </Button>
  );
}
