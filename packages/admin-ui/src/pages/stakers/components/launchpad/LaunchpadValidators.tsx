import React, { useState } from "react";
import "./launchpad-validators.scss";
import Button from "components/Button";
import { Network, StakerItemOk } from "@dappnode/common";
import ExecutionClientsSelect from "./options/ExecutionClientsSelect";
import { StakerConfigGetOk } from "@dappnode/common";
import ConsensusClientSelect from "./options/ConsensusClientSelect";
import MevBoostSelect from "./options/MevBoostSelect";

export default function LaunchpadValidators<T extends Network>({
  stakerConfig,
  setNewExecClient,
  newExecClient,
  setNewConsClient,
  newConsClient
}: {
  stakerConfig: StakerConfigGetOk<T>;
  setNewExecClient: React.Dispatch<
    React.SetStateAction<StakerItemOk<T, "execution"> | undefined>
  >;
  newExecClient?: StakerItemOk<T, "execution">;
  setNewConsClient: React.Dispatch<
    React.SetStateAction<StakerItemOk<T, "consensus"> | undefined>
  >;
  newConsClient?: StakerItemOk<T, "consensus">;
}) {
  // Execution client
  const [executionClient, setExecutionClient] = useState<
    StakerItemOk<T, "execution">
  >();
  // Consensus client
  const [consensusClient, setConsensusClient] = useState<
    StakerItemOk<T, "consensus">
  >();
  // Default fee recipient
  //const [defaultFeeRecipient, setDefaultFeeRecipient] = useState<string>();
  // MEV boost relays
  const [mevBoost, setNewMevBoost] = useState<StakerItemOk<T, "mev-boost">>();

  const [stepIndex, setStepIndex] = useState(0);

  const handleNextStep = () => {
    setStepIndex(prevIndex => prevIndex + 1);
  };

  const handlePrevStep = () => {
    setStepIndex(prevIndex => prevIndex - 1);
  };

  const steps: {
    title: string;
    description: string;
    component: JSX.Element;
  }[] = [
    {
      title: "Select the Execution Client",
      description:
        "Select the execution client you want to use to run the validator node. The execution client is the software that executes the Ethereum 2.0 consensus protocol.",
      component: (
        <ExecutionClientsSelect
          executionClients={stakerConfig.executionClients}
          setNewExecClient={setExecutionClient}
          newExecClient={newExecClient}
        />
      )
    },
    {
      title: "Select the Consensus Client",
      description:
        "Select the consensus client you want to use to run the validator node. The consensus client is the software that manages the validator keys and signs blocks.",
      component: (
        <ConsensusClientSelect
          consensusClients={stakerConfig.consensusClients}
        />
      )
    },
    /**{
      title: "Set the default Fee Recipient",
      description:
        "Set the default fee recipient for the validator(s). The fee recipient is the address that will receive the validator's fees. You can change it at any time.",
      component: <></>
    },*/
    {
      title: "Select the MEV boost relays",
      description:
        "Select the MEV boost relays you want to use to run the validator node. The MEV boost relays are the software that executes the Ethereum 2.0 consensus protocol.",
      component: <MevBoostSelect mevBoost={stakerConfig.mevBoost} />
    }
  ];

  const currentStep = steps[stepIndex];

  return (
    <div className="welcome-container opacity-1">
      <div className="welcome">
        <>
          <div className="header">
            <div className="title">{currentStep.title}</div>
            <div className="description">{currentStep.description}</div>
          </div>
        </>
        <>{currentStep.component}</>

        <div className="bottom-buttons">
          {stepIndex !== 0 && (
            <Button
              onClick={handlePrevStep}
              variant="outline-secondary"
              className="back"
            >
              Back
            </Button>
          )}
          {stepIndex !== steps.length - 1 && (
            <Button
              onClick={handleNextStep}
              variant="dappnode"
              className="next"
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
