import React from "react";
import { api, useApi } from "api";
import { AppContext } from "App";
import Card from "components/Card";
import ErrorView from "components/ErrorView";
import Loading from "components/Loading";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import SubTitle from "components/SubTitle";
import StarknetFullNode from "./columns/StarknetFullNode";
import { Network } from "@dappnode/types";
import { useStarknetConfig } from "./useStarknetConfig";
import "./columns.scss";
import { Alert, Button } from "react-bootstrap";
import { confirm } from "components/ConfirmDialog";
import { disclaimer } from "../data";
import { withToast } from "components/toast/Toast";

export default function Starknet({ 
  network, 
  description 
}: { 
  network: Network.StarknetMainnet | Network.StarknetSepolia;
  description: string;
}) {
  const { theme } = React.useContext(AppContext);

  const currentStakerConfigReq = useApi.stakerConfigGet({ network });
  
  // Check for Ethereum L1 node (mainnet or sepolia depending on Starknet network)
  const ethereumNetwork = network === Network.StarknetMainnet ? Network.Mainnet : Network.Sepolia;
  const ethereumStakerConfigReq = useApi.stakerConfigGet({ network: ethereumNetwork });
  
  // Check if user has an Ethereum node running
  const hasEthereumNode = React.useMemo(() => {
    if (!ethereumStakerConfigReq.data) return false;
    const { executionClients, consensusClients } = ethereumStakerConfigReq.data;
    const hasRunningExecution = executionClients.some(
      (client) => client.status === "ok" && client.isInstalled && client.isRunning && client.isSelected
    );
    const hasRunningConsensus = consensusClients.some(
      (client) => client.status === "ok" && client.isInstalled && client.isSelected
    );
    return hasRunningExecution && hasRunningConsensus;
  }, [ethereumStakerConfigReq.data]);
  
  // hooks
  const {
    reqStatus,
    setReqStatus,
    newFullNode,
    setNewFullNode,
    newStakingApp,
    setNewStakingApp,
    changes
  } = useStarknetConfig(network, currentStakerConfigReq);

  const networkName = network === Network.StarknetMainnet ? "Starknet" : "Starknet Sepolia";

  /**
   * Set new Starknet config
   */
  async function setNewStarknetConfig() {
    try {
      if (changes) {
        await new Promise((resolve: (confirmOnSetConfig: boolean) => void) => {
          confirm({
            title: `Starknet configuration`,
            text: "Are you sure you want to implement this Starknet configuration?",
            buttons: [
              {
                label: "Continue",
                onClick: () => resolve(true)
              }
            ]
          });
        });
        await new Promise((resolve: (confirmOnSetConfig: boolean) => void) => {
          confirm({
            title: `Disclaimer`,
            text: disclaimer,
            buttons: [
              {
                label: "Continue",
                onClick: () => resolve(true)
              }
            ]
          });
        });

        setReqStatus({ loading: true });
        await withToast(
          () =>
            api.stakerConfigSet({
              stakerConfig: {
                network,
                executionDnpName: newFullNode?.dnpName || null,
                consensusDnpName: newStakingApp?.dnpName || null,
                mevBoostDnpName: null, // Starknet doesn't use MEV Boost
                web3signerDnpName: null, // Starknet doesn't use Web3Signer
                relays: []
              }
            }),
          {
            message: `Setting new Starknet configuration...`,
            onSuccess: `Successfully set new Starknet configuration`,
            onError: `Error setting new Starknet configuration`
          }
        );
        setReqStatus({ result: true });
      }
    } catch (e) {
      setReqStatus({ error: e });
    } finally {
      setReqStatus({ loading: true });
      await withToast(() => currentStakerConfigReq.revalidate(), {
        message: `Getting new Starknet configuration`,
        onSuccess: `Successfully loaded Starknet configuration`,
        onError: `Error loading Starknet configuration`
      });
      setReqStatus({ loading: false });
    }
  }

  return (
    <div className={`starknet-container section-spacing ${theme === "light" ? "starknet-light" : "starknet-dark"}`}>
      {currentStakerConfigReq.data ? (
        <>
          <Card>
            <p>{description}</p>
            
            <p>
              Set up your Starknet node configuration: <br />
              (1) <b>Choose</b> a <b>Full Node Client</b> (Juno or Pathfinder) <br />
              (2) [Optional] <b>Select Staking Application</b> to participate in Starknet staking and configure it following the <a href="https://docs.dappnode.io/docs/user/staking/starknet/solo/" target="_blank">docs</a>
            </p>
            
            {!hasEthereumNode && (
              <Alert variant="warning" className="mt-3">
                <Alert.Heading>⚠️ Ethereum L1 Node Required</Alert.Heading>
                <p>
                  Starknet nodes require a connection to an Ethereum L1 node to function properly.
                  You have two options:
                </p>
                <ol className="mb-2">
                  <li>
                    <b>Run a local node:</b> Go to the <b>Stakers</b> menu and set up an Ethereum {network === Network.StarknetMainnet ? "Mainnet" : "Sepolia"} node 
                    (both execution and consensus clients) on your DAppNode.
                  </li>
                  <li>
                    <b>Use an external RPC service:</b> Configure your Starknet node to use an external Ethereum RPC provider 
                    (such as Infura, Alchemy, or other RPC services) if you don't want to run a local Ethereum node.
                  </li>
                </ol>
              </Alert>
            )}
          </Card>

          <Row className="staker-network">
            <Col>
              <SubTitle>Full Node Clients</SubTitle>
              {currentStakerConfigReq.data.executionClients.map((fullNode, i) => (
                <StarknetFullNode
                  key={i}
                  fullNode={fullNode}
                  setNewFullNode={setNewFullNode}
                  isSelected={fullNode.dnpName === newFullNode?.dnpName}
                />
              ))}
            </Col>
            <Col>
              <SubTitle>Staking Application</SubTitle>
              {currentStakerConfigReq.data.consensusClients.map((stakingApp, i) => (
                <StarknetFullNode
                  key={i}
                  fullNode={stakingApp}
                  setNewFullNode={setNewStakingApp}
                  isSelected={stakingApp.dnpName === newStakingApp?.dnpName}
                />
              ))}
            </Col>
          </Row>

          <hr />

          <div>
            <div className="staker-buttons">
              <Button
                variant="dappnode"
                disabled={!changes.isAllowed || reqStatus.loading}
                onClick={() => setNewStarknetConfig()}
              >
                Apply changes
              </Button>
            </div>

            {!changes.isAllowed && changes.reason && (
              <>
                <br />
                <br />
                <Alert variant={changes.severity}>
                  Cannot apply changes: <b>{changes.reason}</b>
                </Alert>
              </>
            )}

            {reqStatus.error && <ErrorView error={reqStatus.error} hideIcon red />}
          </div>
        </>
      ) : currentStakerConfigReq.error ? (
        <ErrorView error={currentStakerConfigReq.error} hideIcon red />
      ) : currentStakerConfigReq.isValidating ? (
        <Loading steps={[`Loading ${networkName} configuration`]} />
      ) : (
        <ErrorView error={"No data found"} hideIcon red />
      )}
    </div>
  );
}
