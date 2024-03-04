import React from "react";
import SubTitle from "components/SubTitle";
import { withToast } from "components/toast/Toast";
import Card from "components/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { StakerConfigGet, StakerConfigGetOk } from "@dappnode/types";
import { api, useApi } from "api";
import ErrorView from "components/ErrorView";
import { confirm } from "components/ConfirmDialog";
import MevBoost from "./columns/MevBoost";
import RemoteSigner from "./columns/RemoteSigner";
import ConsensusClient from "./columns/ConsensusClient";
import ExecutionClient from "./columns/ExecutionClient";
import Button from "components/Button";
import { disclaimer } from "../data";
import Loading from "components/Loading";
import { responseInterface } from "swr";
import { Alert } from "react-bootstrap";
import "./columns.scss";
import { AppContext } from "App";
import LaunchpadValidators from "./launchpad/LaunchpadValidators";
import { FaEthereum } from "react-icons/fa";
import { Network } from "@dappnode/types";
import { useStakerConfig } from "./useStakerConfig";
import { AlertDismissible } from "components/AlertDismissible";
import { docsSmooth } from "params";
import { BsInfoCircleFill } from "react-icons/bs";

export default function StakerNetwork<T extends Network>({
  network,
  description
}: {
  network: T;
  description: string;
}) {
  // Context
  const { theme } = React.useContext(AppContext);

  const currentStakerConfigReq = useApi.stakerConfigGet(
    network
  ) as responseInterface<StakerConfigGet<T>, Error>;

  // hooks
  const {
    showLaunchpadValidators,
    setShowLaunchpadValidators,
    allStakerItemsOk,
    reqStatus,
    setReqStatus,
    newExecClient,
    setNewExecClient,
    newConsClient,
    setNewConsClient,
    newMevBoost,
    setNewMevBoost,
    newEnableWeb3signer,
    setNewEnableWeb3signer,
    changes
  } = useStakerConfig(network, currentStakerConfigReq);

  /**
   * Set new staker config
   */
  async function setNewConfig(isLaunchpad: boolean) {
    try {
      // Make sure there are changes
      if (changes) {
        // TODO: Ask for removing the previous Execution Client and/or Consensus Client if its different
        if (!isLaunchpad) {
          await new Promise(
            (resolve: (confirmOnSetConfig: boolean) => void) => {
              confirm({
                title: `Staker configuration`,
                text:
                  "Are you sure you want to implement this staker configuration?",
                buttons: [
                  {
                    label: "Continue",
                    onClick: () => resolve(true)
                  }
                ]
              });
            }
          );
          await new Promise(
            (resolve: (confirmOnSetConfig: boolean) => void) => {
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
            }
          );
        }

        setReqStatus({ loading: true });
        await withToast(
          () =>
            // Omit metadata to be sent back to the backend
            api.stakerConfigSet({
              stakerConfig: {
                network,
                executionClient:
                  newExecClient?.status === "ok"
                    ? { ...newExecClient, data: undefined }
                    : newExecClient,
                consensusClient:
                  newConsClient?.status === "ok"
                    ? { ...newConsClient, data: undefined }
                    : newConsClient,
                mevBoost:
                  newMevBoost?.status === "ok"
                    ? { ...newMevBoost, data: undefined }
                    : newMevBoost,
                enableWeb3signer: isLaunchpad ? true : newEnableWeb3signer
              }
            }),
          {
            message: `Setting new staker configuration...`,
            onSuccess: `Successfully set new staker configuration`,
            onError: `Error setting new staker configuration`
          }
        );
        setReqStatus({ result: true });
      }
    } catch (e) {
      setReqStatus({ error: e });
    } finally {
      setReqStatus({ loading: true });
      await withToast(() => currentStakerConfigReq.revalidate(), {
        message: `Getting new ${network} staker configuration`,
        onSuccess: `Successfully loaded ${network} staker configuration`,
        onError: `Error new loading ${network} staker configuration`
      });
      setReqStatus({ loading: false });
    }
  }

  return (
    <>
      {network === "prater" && (
        <AlertDismissible variant="warning">
          <p>
            The prater network is about to be deprecated, please migrate to{" "}
            <b>Holesky</b>.
          </p>
        </AlertDismissible>
      )}

      {(network === "prater" || network === "mainnet") && (
        <AlertDismissible variant="info">
          <p>
            <BsInfoCircleFill className="smooth-alert-icon" />
            <b>Smooth is out!</b> Discover the new MEV Smoothing Pool designed for solo validators. It allows you to pool your MEV rewards, ensuring consistent higher rewards. Subscribing is as easy as changing your fee recipient!
            {" "}
            <b>
              <a href={docsSmooth} target="_blank" rel="noopener noreferrer">
                Learn more
              </a>
            </b>
          </p>
        </AlertDismissible>
      )}

      <div className={theme === "light" ? "stakers-light" : "stakers-dark"}>
        {currentStakerConfigReq.data ? (
          <Card>
            <p>
              Set up your Proof-of-Stake validator configuration for Ethereum
              and Ethereum-based chains. You will need to: <br />
              (1) Choose an Execution Layer client <br />
              (2) Choose a Consensus Layer client (+ validator) <br />
              (3) Install the web3signer, which will hold the validator keys and
              sign <br />
              {network !== "gnosis" && network !== "lukso" && (
                <>
                  (4) Optional; delegate block-building capacities through the
                  MEV Boost network and potentially profit from MEV
                </>
              )}
            </p>
            <br />

            <p>{description}</p>

            <Row className="staker-network">
              <Col>
                <SubTitle>Execution Clients</SubTitle>
                {currentStakerConfigReq.data.executionClients.map(
                  (executionClient, i) => (
                    <ExecutionClient<T>
                      key={i}
                      executionClient={executionClient}
                      setNewExecClient={setNewExecClient}
                      isSelected={
                        executionClient.dnpName === newExecClient?.dnpName
                      }
                    />
                  )
                )}
              </Col>

              <Col>
                <SubTitle>Consensus Clients</SubTitle>
                {currentStakerConfigReq.data.consensusClients.map(
                  (consensusClient, i) => (
                    <ConsensusClient<T>
                      key={i}
                      consensusClient={{
                        ...consensusClient,
                        useCheckpointSync: true
                      }}
                      setNewConsClient={setNewConsClient}
                      isSelected={
                        consensusClient.dnpName === newConsClient?.dnpName
                      }
                    />
                  )
                )}
              </Col>

              <Col>
                <SubTitle>Remote signer</SubTitle>
                <RemoteSigner
                  signer={currentStakerConfigReq.data.web3Signer}
                  setEnableWeb3signer={setNewEnableWeb3signer}
                  isSelected={newEnableWeb3signer}
                />
              </Col>
              {(network === "prater" || network === "mainnet") && (
                <Col>
                  <SubTitle>Mev Boost</SubTitle>
                  <MevBoost
                    network={network}
                    mevBoost={currentStakerConfigReq.data.mevBoost}
                    newMevBoost={newMevBoost}
                    setNewMevBoost={setNewMevBoost}
                    isSelected={
                      currentStakerConfigReq.data.mevBoost.dnpName ===
                        newMevBoost?.dnpName
                        ? true
                        : false
                    }
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
                  onClick={() => setNewConfig(false)}
                >
                  Apply changes
                </Button>
                {(network === "prater" || network === "holesky") && (
                  <Button
                    disabled={!allStakerItemsOk}
                    onClick={() => setShowLaunchpadValidators(true)}
                    variant="dappnode"
                  >
                    <FaEthereum /> Step by step setup
                  </Button>
                )}
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

              {reqStatus.error && (
                <ErrorView error={reqStatus.error} hideIcon red />
              )}
            </div>

            {showLaunchpadValidators && allStakerItemsOk && (
              <LaunchpadValidators
                network={network}
                stakerConfig={
                  (currentStakerConfigReq.data as unknown) as StakerConfigGetOk<
                    T
                  >
                }
                setNewConfig={setNewConfig}
                setShowLaunchpadValidators={setShowLaunchpadValidators}
                setNewExecClient={setNewExecClient}
                setNewConsClient={setNewConsClient}
                setNewMevBoost={setNewMevBoost}
                newExecClient={newExecClient}
                newConsClient={newConsClient}
                newMevBoost={newMevBoost}
              />
            )}
          </Card>
        ) : currentStakerConfigReq.error ? (
          <ErrorView error={currentStakerConfigReq.error} hideIcon red />
        ) : currentStakerConfigReq.isValidating ? (
          <Loading steps={[`Loading ${network} staker configuration`]} />
        ) : (
          <ErrorView error={"No data"} hideIcon red />
        )}
      </div>
    </>
  );
}
