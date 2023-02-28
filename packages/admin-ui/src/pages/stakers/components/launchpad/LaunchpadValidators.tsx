import React, { useState } from "react";
import "./launchpad-validators.scss";
import Button from "components/Button";
import { Network, StakerItemOk } from "@dappnode/common";
import { StakerConfigGetOk } from "@dappnode/common";
import MevBoost from "../columns/MevBoost";
import ExecutionClient from "../columns/ExecutionClient";
import ConsensusClient from "../columns/ConsensusClient";
import { VscChromeClose } from "react-icons/vsc";

export default function LaunchpadValidators<T extends Network>({
  network,
  stakerConfig,
  setShowLaunchpadValidators,
  setNewExecClient,
  newExecClient,
  setNewConsClient,
  newConsClient,
  setNewMevBoost,
  newMevBoost,
  feeRecipientError,
  graffitiError,
  defaultGraffiti,
  defaultFeeRecipient,
  defaultCheckpointSync
}: {
  network: T;
  stakerConfig: StakerConfigGetOk<T>;
  setShowLaunchpadValidators: React.Dispatch<React.SetStateAction<boolean>>;
  setNewExecClient: React.Dispatch<
    React.SetStateAction<StakerItemOk<T, "execution"> | undefined>
  >;
  newExecClient?: StakerItemOk<T, "execution">;
  setNewConsClient: React.Dispatch<
    React.SetStateAction<StakerItemOk<T, "consensus"> | undefined>
  >;
  newConsClient?: StakerItemOk<T, "consensus">;
  newMevBoost: StakerItemOk<T, "mev-boost"> | undefined;
  setNewMevBoost: React.Dispatch<
    React.SetStateAction<StakerItemOk<T, "mev-boost"> | undefined>
  >;
  feeRecipientError: string | null;
  graffitiError: string | null;
  defaultGraffiti: string;
  defaultFeeRecipient: string;
  defaultCheckpointSync: string;
}) {
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
      title: "Create the validator keystores and do the deposit",
      description: `To become a ${network.toUpperCase()} validator and participate in the network's Proof of Stake (PoS) consensus mechanism, you will need to create a validator keystore file and make a deposit of at least 32 ETH`,
      component: (
        <Button
          variant="dappnode"
          onClick={() => {
            window.open(
              network === "mainnet"
                ? "https://launchpad.ethereum.org/"
                : network === "prater"
                ? "https://goerli.launchpad.ethereum.org/"
                : "https://launchpad.gnosis.gateway.fm/"
            );
          }}
        >
          {network.toUpperCase()} Launchpad
        </Button>
      )
    },
    {
      title: "Select the Execution Client",
      description:
        "Select the execution client you want to use to run the validator node. The execution client is the software that executes the Ethereum 2.0 consensus protocol.",
      component: (
        <>
          {stakerConfig.executionClients.map((executionClient, i) => (
            <ExecutionClient<T>
              key={i}
              executionClient={executionClient}
              setNewExecClient={setNewExecClient}
              isSelected={executionClient.dnpName === newExecClient?.dnpName}
            />
          ))}
        </>
      )
    },
    {
      title: "Select the Consensus Client",
      description:
        "Select the consensus client you want to use to run the validator node. The consensus client is the software that manages the validator keys and signs blocks.",
      component: (
        <>
          {stakerConfig.consensusClients.map((consensusClient, i) => (
            <ConsensusClient<T>
              key={i}
              consensusClient={consensusClient}
              setNewConsClient={setNewConsClient}
              newConsClient={newConsClient}
              isSelected={consensusClient.dnpName === newConsClient?.dnpName}
              graffitiError={graffitiError}
              feeRecipientError={feeRecipientError}
              defaultGraffiti={defaultGraffiti}
              defaultFeeRecipient={defaultFeeRecipient}
              defaultCheckpointSync={defaultCheckpointSync}
            />
          ))}
        </>
      )
    },
    /**{
      title: "Set the default Fee Recipient",
      description:
        "Set the default fee recipient for the validator(s). The fee recipient is the address that will receive the validator's fees. You can change it at any time.",
      component: <></>
    },*/
    {
      title: "Enable MEV boost and select its relays",
      description:
        "Select the MEV boost relays you want to use to run the validator node. The MEV boost relays are the software that executes the Ethereum 2.0 consensus protocol.",
      component: (
        <MevBoost
          network={network}
          mevBoost={stakerConfig.mevBoost}
          newMevBoost={newMevBoost}
          setNewMevBoost={setNewMevBoost}
          isSelected={stakerConfig.mevBoost.dnpName === newMevBoost?.dnpName}
        />
      )
    },
    {
      title: "Launch the validator node",
      description: "",
      component: <></>
    }
  ];

  const currentStep = steps[stepIndex];

  return (
    <div className="stakers-launchpad-container opacity-1">
      <div className="launchpad">
        <div className="top-button">
          <Button
            onClick={() => setShowLaunchpadValidators(false)}
            variant="danger"
          >
            <VscChromeClose />
          </Button>
        </div>
        <div className="header">
          <div className="title">{currentStep.title}</div>
          <div className="description">{currentStep.description}</div>
        </div>

        <div className="content">{currentStep.component}</div>

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
