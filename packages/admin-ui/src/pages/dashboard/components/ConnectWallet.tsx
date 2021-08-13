import React from "react";
import { ethers } from "ethers";
import CardList from "components/CardList";
import { useApi } from "api";
import ErrorView from "components/ErrorView";
import Ok from "components/Ok";
import Alert from "react-bootstrap/esm/Alert";

declare global {
  interface Window {
    ethereum: any;
  }
}

export default function ConnectWallet() {
  const ethClients = useApi.ethClientsGet();

  async function connectWallet() {
    await window.ethereum.enable();
    const provider = new ethers.providers.Web3Provider(window.ethereum);
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
            {ethClients.data.map(ethClient => (
              <span></span>
            ))}
          </CardList>
        )}
      </div>
    </div>
  );
}
