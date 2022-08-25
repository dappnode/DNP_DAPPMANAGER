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
import "./staker-network.scss";
import { disclaimer } from "../data";
import Loading from "components/Loading";

export default function StakerNetwork({
  network,
  description
}: {
  network: Network;
  description: string;
}) {
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
        web3signer
      } = currentStakerConfigReq.data;

      const executionClient =
        executionClients.find(ec => ec.isSelected && ec.isInstalledAndRunning)
          ?.dnpName || "";
      const consensusClient = consensusClients.find(
        cc => cc.isSelected && cc.isInstalledAndRunning
      ) || { dnpName: "" };
      const enableMevBoost =
        mevBoost.isInstalledAndRunning && mevBoost.isSelected;
      const enableWeb3signer = web3signer.isInstalledAndRunning;

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

  function thereAreChanges(): boolean {
    if (currentStakerConfig) {
      const {
        executionClient,
        consensusClient,
        enableMevBoost,
        enableWeb3signer,
        checkpointSync
      } = currentStakerConfig;
      return (
        executionClient !== newExecClient ||
        consensusClient !== newConsClient ||
        enableMevBoost !== newEnableMevBoost ||
        enableWeb3signer !== newEnableWeb3signer
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
      if (thereAreChanges()) {
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

  if (currentStakerConfigReq.error)
    return <ErrorView error={currentStakerConfigReq.error} hideIcon red />;
  if (currentStakerConfigReq.isValidating)
    return <Loading steps={[`Loading ${network} staker configuration`]} />;
  if (!currentStakerConfigReq.data)
    return <ErrorView error={"No data"} hideIcon red />;

  return (
    <Card>
      <p>
        Setup your staker configuration by selecting the Execution and Consensus
        clients based on your needs, enable and disable the remote signer and
        the mev boost
      </p>
      <br />
      <p>{description}</p>
      <Row>
        <Col>
          <SubTitle>Execution Clients</SubTitle>
          {currentStakerConfigReq.data.executionClients.map(
            (executionClient, i) => (
              <div className="execution-client">
                <ExecutionClient
                  key={i}
                  executionClient={executionClient.dnpName}
                  setNewExecClient={setNewExecClient}
                  isSelected={
                    executionClient.dnpName === newExecClient ? true : false
                  }
                />
              </div>
            )
          )}
        </Col>

        <Col>
          <SubTitle>Consensus Clients</SubTitle>
          {currentStakerConfigReq.data.consensusClients.map(
            (consensusClient, i) => (
              <div className="consensus-client">
                <ConsensusClient
                  key={i}
                  consensusClient={consensusClient}
                  setNewConsClient={setNewConsClient}
                  isSelected={
                    consensusClient.dnpName === newConsClient?.dnpName
                      ? true
                      : false
                  }
                  network={network}
                />
              </div>
            )
          )}
        </Col>

        <Col>
          <SubTitle>Remote signer</SubTitle>
          <div className="remote-signer">
            <RemoteSigner
              signer={currentStakerConfigReq.data.web3signer.dnpName}
              setEnableWeb3signer={setNewEnableWeb3signer}
              isSelected={newEnableWeb3signer}
            />
          </div>
        </Col>
        {network === "prater" && (
          <Col>
            <SubTitle>Mev Boost</SubTitle>
            <div className="mev-boost">
              <MevBoost
                mevBoost={currentStakerConfigReq.data.mevBoost.dnpName}
                setEnableMevBoost={setNewEnableMevBoost}
                isSelected={newEnableMevBoost}
              />
            </div>
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
          disabled={!thereAreChanges() || reqStatus.loading}
          onClick={setNewConfig}
        >
          Apply changes
        </Button>

        {reqStatus.error && <ErrorView error={reqStatus.error} hideIcon red />}
      </div>
    </Card>
  );
}
