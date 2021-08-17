import React from "react";
import CardList from "components/CardList";
import { useApi } from "api";
import ErrorView from "components/ErrorView";
import Ok from "components/Ok";
import Alert from "react-bootstrap/esm/Alert";
import { EthClientWalletOk } from "common";
import Button from "components/Button";
import { prettyDnpName } from "utils/format";
declare global {
  interface Window {
    ethereum: any;
  }
}

export default function ConnectWallet() {
  const ethClients = useApi.ethClientsGet();

  async function walletConnect(ethClient: EthClientWalletOk) {
    // TODO: add testnets ethclients. Chain ID will change: https://chainlist.org/
    if (ethClient.ok) {
      try {
        // https://eips.ethereum.org/EIPS/eip-3326
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xf00" }]
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
              params: [{ chainId: ethClient.chainId, rpcUrls: [ethClient.url] }]
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
  }

  if (ethClients.error)
    return <ErrorView error={ethClients.error} hideIcon red />;
  if (ethClients.isValidating) return <Ok loading msg="Loading eth clients" />;
  if (!ethClients.data) return <ErrorView error={"No data"} hideIcon red />;

  return (
    <div className="dashboard-cards">
      <div className="connect-wallet">
        {ethClients.data.length === 0 ? (
          <Alert className="connect-wallet-card" variant="success">
            No eth client detected, get one from the dappstore
          </Alert>
        ) : (
          <CardList className="connect-wallet">
            {ethClients.data.map(
              ethClient =>
                ethClient.ok && (
                  <div className="connect-wallet-item">
                    <span>{prettyDnpName(ethClient.dnpName)}</span>
                    <Button
                      variant="dappnode"
                      onClick={() => walletConnect(ethClient)}
                    >
                      Connect
                    </Button>
                  </div>
                )
            )}
          </CardList>
        )}
      </div>
    </div>
  );
}
