import React, { useState, useEffect } from "react";
import SubTitle from "components/SubTitle";
import { withToast } from "components/toast/Toast";
import Card from "components/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import {
  ConsensusClient as ConsensusClientIface,
  Network,
  ReqStatus,
  StakerConfigSet
} from "types";
import { api, useApi } from "api";
import ErrorView from "components/ErrorView";
import { confirm } from "components/ConfirmDialog";
import MevBoost from "./columns/MevBoost";
import RemoteSigner from "./columns/RemoteSigner";
import ConsensusClient from "./columns/ConsensusClient";
import ExecutionClient from "./columns/ExecutionClient";
import Button from "components/Button";
import AdvanceView from "./AdvanceView";
import { disclaimer } from "../data";
import Loading from "components/Loading";
import { validateEthereumAddress, validateGraffiti } from "./utils";

export default function StakerNetwork({
  network,
  description
}: {
  network: Network;
  description: string;
}) {
  // Error
  const [feeRecipientError, setFeeRecipientError] = useState<string | null>(
    null
  );
  const [graffitiError, setGraffitiError] = useState<string | null>(null);
  // Req
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});
  // New config
  const [newExecClient, setNewExecClient] = useState<string>();
  const [newConsClient, setNewConsClient] = useState<ConsensusClientIface>();
  const [newEnableMevBoost, setNewEnableMevBoost] = useState<boolean>(false);
  const [newEnableWeb3signer, setNewEnableWeb3signer] = useState<boolean>(
    false
  );

  // Current config
  const [currentStakerConfig, setCurrentStakerConfig] = useState<
    StakerConfigSet
  >();

  const currentStakerConfigReq = useApi.stakerConfigGet(network);

  useEffect(() => {
    if (currentStakerConfigReq.data) {
      const {
        executionClients,
        consensusClients,
        mevBoost,
        web3Signer
      } = currentStakerConfigReq.data;

      const executionClient = executionClients.find(
        ec =>
          ec.status === "ok" && ec.isSelected && ec.isInstalled && ec.isRunning
      )?.dnpName;
      const consensusClient = consensusClients.find(
        cc =>
          cc.status === "ok" && cc.isSelected && cc.isInstalled && cc.isRunning
      );
      const enableMevBoost =
        mevBoost.status === "ok" &&
        mevBoost.isInstalled &&
        mevBoost.isRunning &&
        mevBoost.isSelected;
      const enableWeb3signer =
        web3Signer.status === "ok" &&
        web3Signer.isInstalled &&
        web3Signer.isRunning;

      // Set default values for new staker config
      setNewExecClient(executionClient);
      setNewConsClient(consensusClient);
      setNewEnableMevBoost(enableMevBoost);
      setNewEnableWeb3signer(enableWeb3signer);

      // Set the current config to be displayed in advance view
      setCurrentStakerConfig({
        network,
        executionClient,
        consensusClient,
        enableMevBoost,
        enableWeb3signer
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStakerConfigReq.data]);

  useEffect(() => {
    if (newConsClient) {
      setFeeRecipientError(
        validateEthereumAddress(newConsClient?.feeRecipient)
      );
      setGraffitiError(validateGraffiti(newConsClient?.graffiti));
    }
  }, [newConsClient]);

  function setStakerConfigIsAllowed(): boolean {
    if (currentStakerConfig) {
      const {
        executionClient,
        consensusClient,
        enableMevBoost,
        enableWeb3signer
      } = currentStakerConfig;
      const isExecAndConsSelected = Boolean(
        newExecClient && newConsClient?.dnpName
      );
      const isExecAndConsDeSelected = Boolean(
        !newExecClient && !newConsClient?.dnpName
      );
      return (
        !feeRecipientError &&
        !graffitiError &&
        (isExecAndConsSelected || isExecAndConsDeSelected) &&
        (executionClient !== newExecClient ||
          consensusClient !== newConsClient ||
          enableMevBoost !== newEnableMevBoost ||
          enableWeb3signer !== newEnableWeb3signer)
      );
    }
    return false;
  }

  /**
   * Set new staker config
   */
  async function setNewConfig() {
    try {
      // Make sure there are changes
      if (setStakerConfigIsAllowed()) {
        // TODO: Ask for removing the previous Execution Client and/or Consensus Client if its different
        await new Promise((resolve: (confirmOnSetConfig: boolean) => void) => {
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
                executionClient: newExecClient,
                consensusClient: newConsClient,
                enableMevBoost: newEnableMevBoost,
                enableWeb3signer: newEnableWeb3signer
              }
            }),
          {
            message: `Setting new staker configuration...`,
            onSuccess: `Successfully set new staker configuration`
          }
        );
        setReqStatus({ result: true });
      }
    } catch (e) {
      setReqStatus({ error: e });
    } finally {
      currentStakerConfigReq.revalidate();
    }
  }

  return (
    <>
      {currentStakerConfigReq.data ? (
        <Card>
          <p>
            Setup your staker configuration by selecting the Execution and
            Consensus clients based on your needs, enable and disable the remote
            signer and the mev boost.
          </p>
          <br />
          <p>{description}</p>
          <Row className="staker-network">
            <Col>
              <SubTitle>Execution Clients</SubTitle>
              {currentStakerConfigReq.data.executionClients.map(
                (executionClient, i) => (
                  <ExecutionClient
                    key={i}
                    executionClient={executionClient}
                    setNewExecClient={setNewExecClient}
                    isSelected={
                      executionClient.dnpName === newExecClient ? true : false
                    }
                  />
                )
              )}
            </Col>

            <Col>
              <SubTitle>Consensus Clients</SubTitle>
              {currentStakerConfigReq.data.consensusClients.map(
                (consensusClient, i) => (
                  <ConsensusClient
                    key={i}
                    consensusClient={consensusClient}
                    setNewConsClient={setNewConsClient}
                    newConsClient={newConsClient}
                    isSelected={
                      consensusClient.dnpName === newConsClient?.dnpName
                        ? true
                        : false
                    }
                    graffitiError={graffitiError}
                    feeRecipientError={feeRecipientError}
                    checkpointSyncPlaceHolder={
                      network === "mainnet"
                        ? "https://checkpoint-sync.dappnode.io"
                        : network === "prater"
                        ? "https://checkpoint-sync-prater.dappnode.io"
                        : ""
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
            {network === "prater" && (
              <Col>
                <SubTitle>Mev Boost</SubTitle>
                <MevBoost
                  mevBoost={currentStakerConfigReq.data.mevBoost}
                  setEnableMevBoost={setNewEnableMevBoost}
                  isSelected={newEnableMevBoost}
                />
              </Col>
            )}
          </Row>

          <hr />

          <div>
            {currentStakerConfig && (
              <AdvanceView
                currentStakerConfig={currentStakerConfig}
                newStakerConfig={{
                  network,
                  executionClient: newExecClient,
                  consensusClient: newConsClient,
                  enableMevBoost: newEnableMevBoost,
                  enableWeb3signer: newEnableWeb3signer
                }}
              />
            )}

            <Button
              variant="dappnode"
              disabled={!setStakerConfigIsAllowed() || reqStatus.loading}
              onClick={setNewConfig}
            >
              Apply changes
            </Button>

            {reqStatus.error && (
              <ErrorView error={reqStatus.error} hideIcon red />
            )}
          </div>
        </Card>
      ) : currentStakerConfigReq.error ? (
        <ErrorView error={currentStakerConfigReq.error} hideIcon red />
      ) : currentStakerConfigReq.isValidating ? (
        <Loading steps={[`Loading ${network} staker configuration`]} />
      ) : (
        <ErrorView error={"No data"} hideIcon red />
      )}
    </>
  );
}
