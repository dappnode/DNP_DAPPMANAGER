import React, { useState, useEffect } from "react";
import SubTitle from "components/SubTitle";
import { withToast } from "components/toast/Toast";
import Card from "components/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { Network, StakerConfigSet } from "types";
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

export default function StakerNetwork({
  network,
  description
}: {
  network: Network;
  description: string;
}) {
  // New selections
  const [newExecClient, setNewExecClient] = useState<string>();
  const [newConsClient, setNewConsClient] = useState<string>();
  const [installMevBoost, setInstallMevBoost] = useState<boolean>(false);
  const [installWeb3signer, setInstallWeb3signer] = useState<boolean>(false);
  const [newFeeRecipient, setNewFeeRecipient] = useState<string>();
  const [newGraffiti, setNewGraffiti] = useState<string>();

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
      setInstallMevBoost(currentStakerConfigReq.data.mevBoost.isInstalled);
      setInstallWeb3signer(currentStakerConfigReq.data.web3signer.isInstalled);
      setNewFeeRecipient(currentStakerConfigReq.data.feeRecipient);
      setNewGraffiti(currentStakerConfigReq.data.graffiti);

      // Set the current config to be displayed in advance view
      setCurrentStakerConfig({
        network,
        executionClient: ec,
        consensusClient: cc,
        graffiti: currentStakerConfigReq.data.graffiti,
        feeRecipient: currentStakerConfigReq.data.feeRecipient,
        installMevBoost: currentStakerConfigReq.data.mevBoost.isInstalled,
        installWeb3signer: currentStakerConfigReq.data.web3signer.isInstalled
      });
    }
  }, [currentStakerConfigReq, network]);

  function thereAreChanges(): boolean {
    return newExecClient ||
      newConsClient ||
      installMevBoost ||
      installWeb3signer ||
      newFeeRecipient ||
      newGraffiti
      ? true
      : false;
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

        await withToast(
          () =>
            api.stakerConfigSet({
              stakerConfig: {
                network,
                executionClient: newExecClient,
                consensusClient: newConsClient,
                graffiti: newGraffiti,
                feeRecipient: newFeeRecipient,
                installMevBoost,
                installWeb3signer
              }
            }),
          {
            message: `Setting new staker config...`,
            onSuccess: `Setted new staker config`
          }
        );
      }
    } catch (e) {}
  }

  if (currentStakerConfigReq.error)
    return <ErrorView error={currentStakerConfigReq.error} hideIcon red />;
  if (currentStakerConfigReq.isValidating)
    return <Ok loading msg="Loading packages" />;
  if (!currentStakerConfigReq.data)
    return <ErrorView error={"No data"} hideIcon red />;

  return (
    <Card>
      <Row>
        <Col>
          <SubTitle>Execution Clients</SubTitle>
          {currentStakerConfigReq.data.executionClients.map(executionClient => (
            <ExecutionClient
              executionClient={executionClient.dnpName}
              setNewExecClient={setNewExecClient}
              isInstalled={executionClient.isInstalled}
              isSelected={executionClient.isSelected}
            />
          ))}
        </Col>
        <Col>
          <SubTitle>Consensus Clients</SubTitle>
          {currentStakerConfigReq.data.consensusClients.map(consensusClient => (
            <ConsensusClient
              consensusClient={consensusClient.dnpName}
              setNewConsClient={setNewConsClient}
              isInstalled={consensusClient.isInstalled}
              isSelected={consensusClient.isSelected}
              currentGraffiti={currentStakerConfigReq.data?.graffiti}
              setNewGraffiti={setNewGraffiti}
              currentFeeRecipient={currentStakerConfigReq.data?.feeRecipient}
              setNewFeeRecipient={setNewFeeRecipient}
            />
          ))}
        </Col>

        <Col>
          <SubTitle>Remote signer</SubTitle>
          <RemoteSigner
            signer={currentStakerConfigReq.data.web3signer.dnpName}
            setInstallWeb3signer={setInstallWeb3signer}
            isInstalled={currentStakerConfigReq.data.web3signer.isInstalled}
          />
        </Col>

        <Col>
          <SubTitle>Mev Boost</SubTitle>
          <MevBoost
            mevBoost={currentStakerConfigReq.data.mevBoost.dnpName}
            setInstallMevBoost={setInstallMevBoost}
            isInstalled={currentStakerConfigReq.data.mevBoost.isInstalled}
          />
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
              installMevBoost,
              installWeb3signer
            }}
          />
        )}

        <Button variant="dappnode" disabled={true} onClick={setNewConfig}>
          Apply changes
        </Button>
      </div>
    </Card>
  );
}
