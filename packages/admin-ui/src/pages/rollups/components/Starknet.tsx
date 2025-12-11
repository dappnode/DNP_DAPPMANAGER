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
import StarknetSigner from "./columns/StarknetSigner";
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
  // hooks
  const {
    reqStatus,
    setReqStatus,
    newFullNode,
    setNewFullNode,
    newSigner,
    setNewSigner,
    changes
  } = useStarknetConfig(network, currentStakerConfigReq);




  const networkName = network === Network.StarknetMainnet ? "Starknet" : "Starknet Sepolia";
  // print nall useStakerConfig states for debugging
  React.useEffect(() => {
    console.log("Starknet useStakerConfig states:", {
      reqStatus,
      newFullNode,
      newSigner,
      changes
    });
  }
  , [reqStatus, newFullNode, newSigner, changes]);
  
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
                consensusDnpName: null, // Starknet doesn't use consensus clients
                mevBoostDnpName: null, // Starknet doesn't use MEV Boost
                web3signerDnpName: newSigner?.dnpName || null,
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
            {currentStakerConfigReq.data.web3Signer && (
                <Col>
                <SubTitle>Staking Application</SubTitle>
                <StarknetSigner
                  signer={currentStakerConfigReq.data.web3Signer}
                  setNewSigner={setNewSigner}
                  isSelected={newSigner?.dnpName === currentStakerConfigReq.data.web3Signer.dnpName}
                />
                </Col>
            )}
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
