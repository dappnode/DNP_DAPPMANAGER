import React, { useState, useEffect } from "react";
import SubTitle from "components/SubTitle";
import { withToast } from "components/toast/Toast";
import Card from "components/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { Network, ReqStatus, StakerConfigSet } from "types";
import { api, useApi } from "api";
import ErrorView from "components/ErrorView";
import Ok from "components/Ok";
import { confirm } from "components/ConfirmDialog";
import MevBoost from "./columns/MevBoost";
import RemoteSigner from "./columns/RemoteSigner";
import ConsensusClient from "./columns/ConsensusClient";
import ExecutionClient from "./columns/ExecutionClient";
import Button from "components/Button";
import AdvanceView from "./AdvanceView";
import "./staker-network.scss";

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
  const [newConsClient, setNewConsClient] = useState<string>();
  const [newEnableMevBoost, setNewEnableMevBoost] = useState<boolean>(false);
  const [newEnableWeb3signer, setNewEnableWeb3signer] = useState<boolean>(
    false
  );
  const [newFeeRecipient, setNewFeeRecipient] = useState<string>();
  const [newGraffiti, setNewGraffiti] = useState<string>();
  const [newCheckpointSync, setNewCheckpointSync] = useState<string>();

  // Current config
  const [currentStakerConfig, setCurrentStakerConfig] = useState<
    StakerConfigSet
  >();

  const currentStakerConfigReq = useApi.stakerConfigGet(network);

  useEffect(() => {
    if (currentStakerConfigReq.data) {
      const ec =
        currentStakerConfigReq.data.executionClients.find(
          executionClient => executionClient.isSelected
        )?.dnpName || "";
      const cc =
        currentStakerConfigReq.data.consensusClients.find(
          consensusClient => consensusClient.isSelected
        )?.dnpName || "";

      // Set default values for new staker config
      setNewExecClient(ec);
      setNewConsClient(cc);
      setNewEnableMevBoost(currentStakerConfigReq.data.mevBoost.isInstalled);
      setNewEnableWeb3signer(
        currentStakerConfigReq.data.web3signer.isInstalled
      );
      setNewFeeRecipient(currentStakerConfigReq.data.feeRecipient);
      setNewGraffiti(currentStakerConfigReq.data.graffiti);
      setNewCheckpointSync(currentStakerConfigReq.data.checkpointSync);

      // Set the current config to be displayed in advance view
      setCurrentStakerConfig({
        network,
        executionClient: ec,
        consensusClient: cc,
        graffiti: currentStakerConfigReq.data.graffiti,
        feeRecipient: currentStakerConfigReq.data.feeRecipient,
        checkpointSync: currentStakerConfigReq.data.checkpointSync,
        enableMevBoost: currentStakerConfigReq.data.mevBoost.isInstalled,
        enableWeb3signer: currentStakerConfigReq.data.web3signer.isInstalled
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStakerConfigReq.data]);

  function thereAreChanges(): boolean {
    if (currentStakerConfig) {
      const {
        executionClient,
        consensusClient,
        feeRecipient,
        graffiti,
        enableMevBoost,
        enableWeb3signer,
        checkpointSync
      } = currentStakerConfig;
      return (
        executionClient !== newExecClient ||
        consensusClient !== newConsClient ||
        feeRecipient !== newFeeRecipient ||
        checkpointSync !== newCheckpointSync ||
        graffiti !== newGraffiti ||
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
      if (thereAreChanges()) {
        // Make sure there are changes
        // TODO: Ask for removing the previous Execution Client and/or Consensus Client if its different
        await new Promise((resolve: (confirmOnSetConfig: boolean) => void) => {
          confirm({
            title: `Removal warning`,
            text: "Are you sure you want to set these changes?",
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
                graffiti: newGraffiti,
                feeRecipient: newFeeRecipient,
                checkpointSync: newCheckpointSync,
                enableMevBoost: newEnableMevBoost,
                enableWeb3signer: newEnableWeb3signer
              }
            }),
          {
            message: `Setting new staker configuration...`,
            onSuccess: `Setted new staker configuration`
          }
        );
        setReqStatus({ result: true });
      }
    } catch (e) {
      setReqStatus({ error: e });
    }
  }

  if (currentStakerConfigReq.error)
    return <ErrorView error={currentStakerConfigReq.error} hideIcon red />;
  if (currentStakerConfigReq.isValidating)
    return <Ok loading msg="Loading packages" />;
  if (!currentStakerConfigReq.data)
    return <ErrorView error={"No data"} hideIcon red />;

  return (
    <Card>
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
                  isInstalled={executionClient.isInstalled}
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
                  consensusClient={consensusClient.dnpName}
                  setNewConsClient={setNewConsClient}
                  isInstalled={consensusClient.isInstalled}
                  isSelected={
                    consensusClient.dnpName === newConsClient ? true : false
                  }
                  graffiti={newGraffiti}
                  setNewGraffiti={setNewGraffiti}
                  feeRecipient={newFeeRecipient}
                  setNewFeeRecipient={setNewFeeRecipient}
                  checkpointSync={newCheckpointSync}
                  setNewCheckpointSync={setNewCheckpointSync}
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

        <Col>
          <SubTitle>Mev Boost</SubTitle>
          <div className="mev-boost">
            <MevBoost
              mevBoost={currentStakerConfigReq.data.mevBoost.dnpName}
              setEnableMevBoost={setNewEnableMevBoost}
              isInstalled={currentStakerConfigReq.data.mevBoost.isInstalled}
              isSelected={newEnableMevBoost}
            />
          </div>
        </Col>
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
              graffiti: newGraffiti,
              feeRecipient: newFeeRecipient,
              checkpointSync: newCheckpointSync,
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
